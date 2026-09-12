import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Order, IOrderDocument } from "@/models/Order";
import { Delivery, IDeliveryDocument } from "@/models/Delivery";
import {
  DeliveryPartnerProfile,
  IDeliveryPartnerProfileDocument,
} from "@/models/DeliveryPartnerProfile";
import { AuditLog } from "@/models/AuditLog";
import { sendOrderNotification } from "@/lib/order-engine";
import { getApiKey, DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODELS } from "@/lib/gemini";
import { GoogleGenAI } from "@google/genai";
import { aiAssignmentDecisionSchema, AiAssignmentDecision } from "@/schemas";
import { AssignmentMethod } from "@/types";

export const AI_AUTO_ASSIGN_MIN_CONFIDENCE = 0.85;
export const MAX_LOCATION_AGE_SECONDS = 900; // 15 minutes max GPS staleness for assignment

export interface CandidateMetrics {
  partnerId: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleCapacityKg: number;
  distanceToPickupKm: number;
  distanceToDestinationKm: number;
  estimatedTravelTimeMinutes: number;
  activeDeliveryCount: number;
  locationAgeSeconds: number;
  rating: number;
  completedDeliveries: number;
  deterministicScore: number;
  serviceAreaMatch: boolean;
  scoreBreakdown: {
    proximityScore: number;
    capacityScore: number;
    workloadScore: number;
    freshnessScore: number;
    ratingScore: number;
  };
}

export interface RecommendationResult {
  orderId: string;
  orderNumber: string;
  orderWeightKg: number;
  pickupDistrict: string;
  nearbyCount: number;
  eligibleCount: number;
  recommendedPartnerId: string | null;
  confidence: number;
  reason: string;
  isAiGenerated: boolean;
  modelUsed: string;
  rankedCandidates: Array<
    CandidateMetrics & {
      aiScore?: number;
      aiReason?: string;
    }
  >;
}

/**
 * Terrestrial Haversine formula for exact distance between two WGS84 coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculate total order weight in kg from order items
 */
export function calculateOrderWeightKg(order: IOrderDocument): number {
  let totalKg = 0;
  for (const item of order.items) {
    const qty = item.quantity || 1;
    switch (item.unit) {
      case "ton":
        totalKg += qty * 1000;
        break;
      case "quintal":
        totalKg += qty * 100;
        break;
      case "crate":
        totalKg += qty * 20; // Avg 20kg per agritech vegetable crate
        break;
      case "kg":
      default:
        totalKg += qty;
        break;
    }
  }
  return Math.max(1, Math.round(totalKg * 10) / 10);
}

/**
 * STEP 1: Find eligible delivery partners using MongoDB Geospatial indexing + Hard Filters
 */
export async function findEligibleDeliveryPartners(params: {
  pickupLat: number;
  pickupLng: number;
  orderWeightKg: number;
  maxRadiusKm?: number;
}): Promise<
  Array<{
    profile: IDeliveryPartnerProfileDocument;
    distanceKm: number;
  }>
> {
  await connectToDatabase();

  const maxDistanceMeters = (params.maxRadiusKm || 40) * 1000;
  const now = Date.now();

  // 1. Hard Eligibility Filter in MongoDB
  const candidates = await DeliveryPartnerProfile.find({
    verificationStatus: "VERIFIED",
    isOnline: true,
    isAvailableForAssignment: true,
    vehicleCapacityKg: { $gte: params.orderWeightKg },
    "currentLocation.locationGeo": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [params.pickupLng, params.pickupLat], // [longitude, latitude]
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  })
    .populate("user", "name email phone status role")
    .lean();

  const eligibleList: Array<{
    profile: IDeliveryPartnerProfileDocument;
    distanceKm: number;
  }> = [];

  for (const candidate of candidates) {
    const user = candidate.user as unknown as { status?: string; role?: string };
    if (!user || user.status !== "ACTIVE" || user.role !== "DELIVERY_PARTNER") {
      continue;
    }

    const lat = candidate.currentLocation?.latitude;
    const lng = candidate.currentLocation?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    // Check location freshness (reject if GPS > 15 minutes old)
    const updatedAt = candidate.currentLocation.updatedAt
      ? new Date(candidate.currentLocation.updatedAt).getTime()
      : 0;
    const ageSeconds = Math.round((now - updatedAt) / 1000);
    if (ageSeconds > MAX_LOCATION_AGE_SECONDS) {
      continue;
    }

    const distKm = calculateHaversineDistanceKm(
      params.pickupLat,
      params.pickupLng,
      lat,
      lng
    );

    // Verify within partner's configured service radius
    const maxRadius = candidate.serviceArea?.radiusKm || 35;
    if (distKm > maxRadius) {
      continue;
    }

    eligibleList.push({
      profile: candidate as unknown as IDeliveryPartnerProfileDocument,
      distanceKm: distKm,
    });
  }

  return eligibleList;
}

/**
 * STEP 2: Calculate deterministic operational metrics and score for a candidate
 */
export async function calculateDeterministicCandidateData(
  profile: IDeliveryPartnerProfileDocument,
  pickupCoords: { latitude: number; longitude: number },
  destCoords: { latitude: number; longitude: number },
  orderWeightKg: number,
  distToPickupKm: number
): Promise<CandidateMetrics> {
  const user = profile.user as unknown as { _id?: unknown; name?: string; phone?: string };
  const userId = user?._id ? String(user._id) : String(profile._id);

  const distToDestKm = calculateHaversineDistanceKm(
    profile.currentLocation.latitude,
    profile.currentLocation.longitude,
    destCoords.latitude,
    destCoords.longitude
  );

  const travelTimeMinutes = Math.max(5, Math.round(distToPickupKm * 2.5));
  const locationAgeSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(profile.currentLocation.updatedAt).getTime()) / 1000)
  );

  // Check active delivery count
  const activeCount = await Delivery.countDocuments({
    assignedPartner: profile.user,
    status: { $in: ["ASSIGNED", "ACCEPTED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
  });

  // 1. Proximity Score (0 - 40 pts): Closer is better
  const proximityScore = Math.max(0, Math.round((1 - Math.min(distToPickupKm, 30) / 30) * 40));

  // 2. Capacity Score (0 - 25 pts): Fit without excessive oversize
  const ratio = profile.vehicleCapacityKg / Math.max(1, orderWeightKg);
  let capacityScore = 25;
  if (ratio < 1) {
    capacityScore = 0; // Physically ineligible
  } else if (ratio > 10 && profile.vehicleCapacityKg > 800 && orderWeightKg < 30) {
    // Heavily penalize deploying a 1-ton truck for a 15kg tomato parcel
    capacityScore = 12;
  }

  // 3. Workload Score (0 - 15 pts): 0 active trips = 15 pts
  const workloadScore = activeCount === 0 ? 15 : activeCount === 1 ? 8 : 2;

  // 4. Freshness Score (0 - 10 pts): <120s = 10 pts, <600s = 5 pts
  const freshnessScore =
    locationAgeSeconds <= 120 ? 10 : locationAgeSeconds <= 600 ? 6 : 2;

  // 5. Rating Score (0 - 10 pts)
  const ratingScore = Math.round(((profile.statistics?.rating || 4.5) / 5) * 10);

  const deterministicScore =
    proximityScore + capacityScore + workloadScore + freshnessScore + ratingScore;

  return {
    partnerId: profile._id.toString(),
    userId,
    name: profile.fullName || user?.name || "Delivery Partner",
    phone: profile.phone || user?.phone || "",
    vehicleType: profile.vehicleType,
    vehicleNumber: profile.vehicleNumber,
    vehicleCapacityKg: profile.vehicleCapacityKg,
    distanceToPickupKm: distToPickupKm,
    distanceToDestinationKm: distToDestKm,
    estimatedTravelTimeMinutes: travelTimeMinutes,
    activeDeliveryCount: activeCount,
    locationAgeSeconds,
    rating: profile.statistics?.rating || 4.8,
    completedDeliveries: profile.statistics?.completedDeliveries || 0,
    deterministicScore,
    serviceAreaMatch: true,
    scoreBreakdown: {
      proximityScore,
      capacityScore,
      workloadScore,
      freshnessScore,
      ratingScore,
    },
  };
}

/**
 * STEP 3: Rank candidates using Google Gemini AI Structured Analysis
 * Falls back deterministically if Gemini is unavailable or times out.
 */
export async function rankCandidatesWithAI(
  order: IOrderDocument,
  candidates: CandidateMetrics[]
): Promise<{
  recommendedPartnerId: string | null;
  confidence: number;
  reason: string;
  isAiGenerated: boolean;
  modelUsed: string;
  rankedList: Array<
    CandidateMetrics & {
      aiScore?: number;
      aiReason?: string;
    }
  >;
}> {
  if (candidates.length === 0) {
    return {
      recommendedPartnerId: null,
      confidence: 0,
      reason: "No verified delivery partners with sufficient vehicle capacity and active GPS found nearby.",
      isAiGenerated: false,
      modelUsed: "deterministic-filter",
      rankedList: [],
    };
  }

  // Sort deterministically first as baseline
  const sortedDeterministic = [...candidates].sort(
    (a, b) => b.deterministicScore - a.deterministicScore
  );

  const apiKey = getApiKey();
  if (!apiKey || candidates.length === 1) {
    const top = sortedDeterministic[0];
    return {
      recommendedPartnerId: top.partnerId,
      confidence: candidates.length === 1 ? 0.95 : 0.88,
      reason: `Deterministic optimal match: ${top.name} (${top.vehicleType}, ${top.vehicleCapacityKg}kg capacity) is ${top.distanceToPickupKm} km from pickup with active GPS.`,
      isAiGenerated: false,
      modelUsed: "deterministic-scorer",
      rankedList: sortedDeterministic,
    };
  }

  // Compact, non-sensitive payload for Gemini analysis
  const orderWeightKg = calculateOrderWeightKg(order);
  const promptPayload = {
    orderContext: {
      orderNumber: order.orderNumber,
      weightKg: orderWeightKg,
      pickupDistrict: order.deliveryAddress?.district || "Bhubaneswar",
    },
    candidates: candidates.map((c) => ({
      partnerId: c.partnerId,
      vehicleType: c.vehicleType,
      capacityKg: c.vehicleCapacityKg,
      distanceKm: c.distanceToPickupKm,
      activeDeliveries: c.activeDeliveryCount,
      locationAgeSec: c.locationAgeSeconds,
      rating: c.rating,
      completedOrders: c.completedDeliveries,
      deterministicBaselineScore: c.deterministicScore,
    })),
  };

  const prompt = `You are the KISANOVA Agritech Smart Logistics Dispatch Engine.
Analyze the following eligible delivery partners for an agricultural produce dispatch in Odisha, India.

CRITICAL RULES:
1. Do NOT invent fake coordinates, distances, or vehicle numbers.
2. Evaluate candidates based on:
   - Proximity to pickup (lower distance is better)
   - Vehicle capacity efficiency (matches ${orderWeightKg}kg order without excessive waste)
   - Low current workload
   - Freshness of GPS ping
   - Reliability & rating
3. Respond ONLY with valid JSON matching this schema:
{
  "recommendedPartnerId": "<exact partnerId of best candidate>",
  "confidence": <number between 0.0 and 1.0>,
  "reason": "<one clear professional explanation sentence>",
  "rankedCandidates": [
    {
      "partnerId": "<exact partnerId>",
      "score": <number between 0 and 100>,
      "reason": "<short justification>"
    }
  ]
}

DATASET:
${JSON.stringify(promptPayload, null, 2)}`;

  const candidateModels = [DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS];
  const ai = new GoogleGenAI({ apiKey });

  for (const model of candidateModels) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini AI dispatch ranking timed out after 7s")), 7000)
      );

      const callPromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const response = (await Promise.race([callPromise, timeoutPromise])) as {
        text?: string;
      };

      const rawText = response?.text?.trim();
      if (!rawText) continue;

      let cleanJson = rawText;
      const codeFenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeFenceMatch) {
        cleanJson = codeFenceMatch[1].trim();
      }

      const parsedJson = JSON.parse(cleanJson);
      const validation = aiAssignmentDecisionSchema.safeParse(parsedJson);

      if (validation.success) {
        const decision: AiAssignmentDecision = validation.data;

        // Verify the recommended partner actually exists in the candidate pool
        const match = candidates.find((c) => c.partnerId === decision.recommendedPartnerId);
        if (match) {
          const rankedList = candidates.map((c) => {
            const aiItem = decision.rankedCandidates.find((rc) => rc.partnerId === c.partnerId);
            return {
              ...c,
              aiScore: aiItem?.score ?? c.deterministicScore,
              aiReason: aiItem?.reason ?? "Evaluated by AI logistics engine",
            };
          });

          rankedList.sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));

          return {
            recommendedPartnerId: decision.recommendedPartnerId,
            confidence: Math.round(decision.confidence * 100) / 100,
            reason: decision.reason,
            isAiGenerated: true,
            modelUsed: model,
            rankedList,
          };
        }
      }
    } catch (geminiErr) {
      console.warn(`[Gemini AI Dispatch Fallback] Model ${model} failed:`, (geminiErr as Error).message);
    }
  }

  // Graceful deterministic fallback
  const top = sortedDeterministic[0];
  return {
    recommendedPartnerId: top.partnerId,
    confidence: 0.88,
    reason: `Deterministic optimal match: ${top.name} (${top.vehicleType}, ${top.vehicleCapacityKg}kg capacity) is closest (${top.distanceToPickupKm} km) with active GPS. (AI fallback applied)`,
    isAiGenerated: false,
    modelUsed: "deterministic-fallback",
    rankedList: sortedDeterministic,
  };
}

/**
 * STEP 4: Comprehensive Recommendation Engine (Public Service Entry)
 */
export async function recommendDeliveryPartners(orderId: string): Promise<RecommendationResult> {
  await connectToDatabase();

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const orderWeightKg = calculateOrderWeightKg(order);

  // Determine pickup coordinates from order or default Odisha farm hub
  const pickupLat =
    order.deliveryAddress?.coordinates?.latitude || 20.4625; // Cuttack/Badamba region
  const pickupLng =
    order.deliveryAddress?.coordinates?.longitude || 85.883;

  const destCoords = {
    latitude: order.deliveryAddress?.coordinates?.latitude || 20.2961,
    longitude: order.deliveryAddress?.coordinates?.longitude || 85.8245,
  };

  // Find nearby eligible partners
  const eligibleMatches = await findEligibleDeliveryPartners({
    pickupLat,
    pickupLng,
    orderWeightKg,
  });

  const candidateMetrics: CandidateMetrics[] = [];
  for (const match of eligibleMatches) {
    const metrics = await calculateDeterministicCandidateData(
      match.profile,
      { latitude: pickupLat, longitude: pickupLng },
      destCoords,
      orderWeightKg,
      match.distanceKm
    );
    candidateMetrics.push(metrics);
  }

  // Rank with AI
  const aiResult = await rankCandidatesWithAI(order, candidateMetrics);

  return {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    orderWeightKg,
    pickupDistrict: order.deliveryAddress?.district || "Bhubaneswar",
    nearbyCount: eligibleMatches.length,
    eligibleCount: candidateMetrics.length,
    recommendedPartnerId: aiResult.recommendedPartnerId,
    confidence: aiResult.confidence,
    reason: aiResult.reason,
    isAiGenerated: aiResult.isAiGenerated,
    modelUsed: aiResult.modelUsed,
    rankedCandidates: aiResult.rankedList,
  };
}

/**
 * STEP 5: Server-side Safety Re-Validation before assignment execution
 */
export async function validateAIRecommendation(
  partnerProfileId: string,
  orderId: string
): Promise<{
  isValid: boolean;
  partnerProfile?: IDeliveryPartnerProfileDocument;
  user?: { _id: mongoose.Types.ObjectId; name: string };
  reason?: string;
}> {
  await connectToDatabase();

  const [order, profile] = await Promise.all([
    Order.findById(orderId),
    DeliveryPartnerProfile.findById(partnerProfileId).populate("user"),
  ]);

  if (!order) {
    return { isValid: false, reason: "Order not found" };
  }

  if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
    return { isValid: false, reason: `Order is already in terminal state: ${order.orderStatus}` };
  }

  if (!profile) {
    return { isValid: false, reason: "Delivery Partner profile not found" };
  }

  if (profile.verificationStatus !== "VERIFIED") {
    return { isValid: false, reason: "Delivery Partner is not verified" };
  }

  if (!profile.isOnline) {
    return { isValid: false, reason: "Delivery Partner has gone offline" };
  }

  if (!profile.isAvailableForAssignment) {
    return { isValid: false, reason: "Delivery Partner is currently busy with another active trip" };
  }

  const orderWeightKg = calculateOrderWeightKg(order);
  if (profile.vehicleCapacityKg < orderWeightKg) {
    return {
      isValid: false,
      reason: `Vehicle capacity (${profile.vehicleCapacityKg}kg) is insufficient for order (${orderWeightKg}kg)`,
    };
  }

  const user = profile.user as unknown as { _id: mongoose.Types.ObjectId; name: string };
  return { isValid: true, partnerProfile: profile, user };
}

/**
 * STEP 6: Execute Delivery Partner Assignment
 */
export async function assignDeliveryPartner(params: {
  orderId: string;
  partnerProfileId: string;
  assignedByUserId?: string;
  method?: AssignmentMethod;
  aiConfidence?: number;
  aiReason?: string;
  rankingScore?: number;
}): Promise<{
  success: boolean;
  delivery: IDeliveryDocument;
  message: string;
}> {
  await connectToDatabase();

  const { orderId, partnerProfileId, assignedByUserId, method, aiConfidence, aiReason, rankingScore } =
    params;

  // 1. Validate safety rules
  const validation = await validateAIRecommendation(partnerProfileId, orderId);
  if (!validation.isValid || !validation.partnerProfile || !validation.user) {
    throw new Error(validation.reason || "Delivery assignment validation failed");
  }

  const profile = validation.partnerProfile;
  const user = validation.user;
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  // 2. Find or create Delivery record
  let delivery = await Delivery.findOne({ order: order._id });
  if (!delivery) {
    const distKm = profile.currentLocation?.latitude
      ? calculateHaversineDistanceKm(
          profile.currentLocation.latitude,
          profile.currentLocation.longitude,
          order.deliveryAddress?.coordinates?.latitude || 20.2961,
          order.deliveryAddress?.coordinates?.longitude || 85.8245
        )
      : 15;

    delivery = await Delivery.create({
      deliveryTrackingNumber: `KD-TRK-${order.orderNumber.replace(/[^0-9]/g, "").slice(-5)}-${Math.floor(100 + Math.random() * 900)}`,
      order: order._id,
      pickupLocation: {
        name: `${order.deliveryAddress?.district || "Bhubaneswar"} Farm Gate Hub`,
        address: "Regional Produce Aggregation Hub",
        district: order.deliveryAddress?.district || "Khordha",
        state: order.deliveryAddress?.state || "Odisha",
        latitude: 20.4625,
        longitude: 85.883,
        contactPhone: "9822012345",
      },
      destination: {
        name: order.deliveryAddress?.recipientName || "Valued Customer",
        address: order.deliveryAddress?.addressLine || "Address Provided",
        district: order.deliveryAddress?.district || "Khordha",
        state: order.deliveryAddress?.state || "Odisha",
        latitude: order.deliveryAddress?.coordinates?.latitude || 20.2961,
        longitude: order.deliveryAddress?.coordinates?.longitude || 85.8245,
        contactPhone: order.deliveryAddress?.recipientPhone || "9876543210",
      },
      status: "ASSIGNED",
      assignmentStatus: "ASSIGNED",
      estimatedDistanceKm: distKm,
      estimatedDurationMinutes: Math.round(distKm * 2.5),
      otpCode: order.deliveryOtp,
    });
  }

  const distanceAtAssignment = profile.currentLocation?.latitude
    ? calculateHaversineDistanceKm(
        profile.currentLocation.latitude,
        profile.currentLocation.longitude,
        delivery.pickupLocation.latitude,
        delivery.pickupLocation.longitude
      )
    : 10;

  // 3. Atomically update Delivery document
  delivery.assignedPartner = user._id;
  delivery.driverName = profile.fullName || user.name;
  delivery.driverPhone = profile.phone;
  delivery.status = "ASSIGNED";
  delivery.assignmentStatus = "ASSIGNED";
  delivery.assignedAt = new Date();

  // Appends to historical trail
  if (!Array.isArray(delivery.assignmentHistory)) {
    delivery.assignmentHistory = [];
  }

  delivery.assignmentHistory.push({
    partner: user._id,
    partnerName: profile.fullName || user.name,
    assignedAt: new Date(),
    assignedBy: assignedByUserId ? new mongoose.Types.ObjectId(assignedByUserId) : undefined,
    assignmentMethod: method || "ADMIN_MANUAL",
    aiConfidence,
    aiReason,
    rankingScore,
    distanceAtAssignmentKm: distanceAtAssignment,
    status: "ASSIGNED",
  });

  if (!Array.isArray(delivery.statusHistory)) {
    delivery.statusHistory = [];
  }
  delivery.statusHistory.push({
    status: "ASSIGNED",
    changedBy: assignedByUserId ? new mongoose.Types.ObjectId(assignedByUserId) : undefined,
    changedByRole: assignedByUserId ? "ADMIN" : "SYSTEM",
    timestamp: new Date(),
    note: aiReason || `Assigned to ${profile.fullName} (${profile.vehicleType})`,
  });

  await delivery.save();

  // 4. Synchronize Order Status to ASSIGNED_FOR_DELIVERY
  order.orderStatus = "ASSIGNED_FOR_DELIVERY";
  order.deliveryId = delivery._id as mongoose.Types.ObjectId;
  order.statusHistory.push({
    status: "ASSIGNED_FOR_DELIVERY",
    timestamp: new Date(),
    note: `Delivery assigned to ${profile.fullName} (${profile.vehicleNumber})`,
  });
  await order.save();

  // 5. Update partner availability state (mark busy with active trip)
  profile.isAvailableForAssignment = false;
  profile.statistics.totalAssignedDeliveries = (profile.statistics.totalAssignedDeliveries || 0) + 1;
  await profile.save();

  // 6. Record in Audit Log
  await AuditLog.create({
    actor: assignedByUserId ? new mongoose.Types.ObjectId(assignedByUserId) : undefined,
    actorRole: assignedByUserId ? "ADMIN" : "SYSTEM",
    action: "DELIVERY_ASSIGNED",
    entity: "Delivery",
    entityId: delivery._id,
    metadata: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      partnerId: profile._id,
      partnerUserId: user._id,
      method: method || "ADMIN_MANUAL",
      aiConfidence,
      aiReason,
    },
  });

  // 7. Dispatch Notifications
  // Notify Delivery Partner
  await sendOrderNotification({
    recipientId: user._id,
    type: "DELIVERY_UPDATE",
    title: "New Delivery Assignment!",
    message: `You have been assigned order #${order.orderNumber} (${calculateOrderWeightKg(order)}kg). Pickup at ${delivery.pickupLocation.name}.`,
    link: "/delivery/dashboard",
    metadata: { deliveryId: delivery._id, orderId: order._id },
  });

  // Notify Buyer
  await sendOrderNotification({
    recipientId: order.buyer,
    type: "DELIVERY_UPDATE",
    title: "Delivery Partner Assigned",
    message: `${profile.fullName} has been assigned to deliver order #${order.orderNumber}.`,
    link: order.buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`,
    metadata: { deliveryId: delivery._id, orderId: order._id },
  });

  return {
    success: true,
    delivery,
    message: `Delivery partner ${profile.fullName} successfully assigned via ${method || "ADMIN_MANUAL"}.`,
  };
}

/**
 * STEP 7: Automatic AI Dispatch Trigger
 */
export async function autoAssignDeliveryPartner(orderId: string): Promise<{
  autoAssigned: boolean;
  message: string;
  recommendation?: RecommendationResult;
  delivery?: IDeliveryDocument;
}> {
  const rec = await recommendDeliveryPartners(orderId);

  if (!rec.recommendedPartnerId) {
    return {
      autoAssigned: false,
      message: "No eligible delivery partners available for auto-assignment.",
      recommendation: rec,
    };
  }

  // Check confidence threshold
  if (rec.confidence >= AI_AUTO_ASSIGN_MIN_CONFIDENCE) {
    try {
      const assigned = await assignDeliveryPartner({
        orderId,
        partnerProfileId: rec.recommendedPartnerId,
        method: rec.isAiGenerated ? "AI_AUTO" : "FALLBACK_AUTO",
        aiConfidence: rec.confidence,
        aiReason: rec.reason,
        rankingScore: rec.rankedCandidates[0]?.aiScore || 90,
      });

      return {
        autoAssigned: true,
        message: `AI Auto-Assigned partner with ${(rec.confidence * 100).toFixed(0)}% confidence: ${rec.reason}`,
        recommendation: rec,
        delivery: assigned.delivery,
      };
    } catch (assignErr) {
      return {
        autoAssigned: false,
        message: `Auto-assignment validation failed: ${(assignErr as Error).message}`,
        recommendation: rec,
      };
    }
  }

  return {
    autoAssigned: false,
    message: `AI confidence (${(rec.confidence * 100).toFixed(0)}%) below threshold (${AI_AUTO_ASSIGN_MIN_CONFIDENCE * 100}%). Manual Admin review required.`,
    recommendation: rec,
  };
}

/**
 * STEP 8: Reassignment Engine (when partner rejects or fails)
 */
export async function reassignDeliveryPartner(params: {
  deliveryId: string;
  newPartnerProfileId: string;
  reason: string;
  adminUserId?: string;
}): Promise<{
  success: boolean;
  delivery: IDeliveryDocument;
  message: string;
}> {
  await connectToDatabase();

  const { deliveryId, newPartnerProfileId, reason, adminUserId } = params;
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error("Delivery dispatch not found");

  // 1. Release previous partner back to AVAILABLE
  if (delivery.assignedPartner) {
    await DeliveryPartnerProfile.findOneAndUpdate(
      { user: delivery.assignedPartner },
      { $set: { isAvailableForAssignment: true } }
    );

    // Update assignment history
    if (Array.isArray(delivery.assignmentHistory) && delivery.assignmentHistory.length > 0) {
      const lastEntry = delivery.assignmentHistory[delivery.assignmentHistory.length - 1];
      lastEntry.status = "REASSIGNED";
      lastEntry.unassignedAt = new Date();
      lastEntry.reassignmentReason = reason;
    }
  }

  // 2. Validate and assign new partner
  const orderId = delivery.order.toString();
  const validation = await validateAIRecommendation(newPartnerProfileId, orderId);
  if (!validation.isValid || !validation.partnerProfile || !validation.user) {
    throw new Error(validation.reason || "New delivery partner candidate is not eligible for reassignment");
  }

  const profile = validation.partnerProfile;
  const user = validation.user;

  delivery.assignedPartner = user._id;
  delivery.driverName = profile.fullName;
  delivery.driverPhone = profile.phone;
  delivery.status = "ASSIGNED";
  delivery.assignmentStatus = "ASSIGNED";
  delivery.assignedAt = new Date();

  delivery.assignmentHistory.push({
    partner: user._id,
    partnerName: profile.fullName,
    assignedAt: new Date(),
    assignedBy: adminUserId ? new mongoose.Types.ObjectId(adminUserId) : undefined,
    assignmentMethod: "ADMIN_MANUAL",
    status: "ASSIGNED",
    reassignmentReason: `Reassigned from previous driver: ${reason}`,
  });

  delivery.statusHistory.push({
    status: "ASSIGNED",
    changedBy: adminUserId ? new mongoose.Types.ObjectId(adminUserId) : undefined,
    changedByRole: adminUserId ? "ADMIN" : "SYSTEM",
    timestamp: new Date(),
    note: `Reassigned to ${profile.fullName}. Reason: ${reason}`,
  });

  await delivery.save();

  // Mark new partner busy
  profile.isAvailableForAssignment = false;
  await profile.save();

  // Audit log
  await AuditLog.create({
    actor: adminUserId ? new mongoose.Types.ObjectId(adminUserId) : undefined,
    actorRole: adminUserId ? "ADMIN" : "SYSTEM",
    action: "DELIVERY_REASSIGNED",
    entity: "Delivery",
    entityId: delivery._id,
    metadata: {
      orderId,
      newPartnerId: profile._id,
      reason,
    },
  });

  return {
    success: true,
    delivery,
    message: `Delivery successfully reassigned to ${profile.fullName}.`,
  };
}
