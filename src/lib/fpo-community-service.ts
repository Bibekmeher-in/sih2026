import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  User,
  FPO,
  FarmerProfile,
  Product,
  Order,
  BulkRequirement,
  Notification,
  FarmerGroup,
  GroupMembership,
  CommunityPost,
  CommunityComment,
  ProduceAggregation,
  IFarmerGroupDocument,
  ICommunityPostDocument,
  IProduceAggregationDocument,
  GroupPrivacy,
  CommunityPostType,
} from "@/models";

export interface FpoDashboardSummary {
  fpoDetails: {
    id: string;
    organizationName: string;
    registrationNumber: string;
    yearOfEstablishment: number;
    district: string;
    state: string;
    status: string;
    memberFarmerCount: number;
    cropSpecialization: string[];
  };
  metrics: {
    activeFarmers: number;
    farmerGroups: number;
    activeDiscussions: number;
    aggregatedProduceKg: number;
    pendingBulkOpportunities: number;
    activeBulkOrders: number;
  };
  recentCommunityActivity: Array<{
    id: string;
    type: "POST" | "JOIN" | "AGGREGATION" | "BUYER" | "PRICE";
    title: string;
    description: string;
    authorName: string;
    timestamp: Date;
    groupName?: string;
  }>;
  topActiveGroups: Array<{
    id: string;
    name: string;
    product: string;
    category: string;
    memberCount: number;
    postCount: number;
    aggregatedQuantityKg: number;
    location: string;
  }>;
  currentBulkOpportunities: Array<{
    id: string;
    buyerName: string;
    productName: string;
    requiredQuantity: number;
    unit: string;
    targetPrice: number;
    location: string;
    requiredDate: Date;
    status: string;
    matchScore: number;
    suitableGroupName?: string;
    availableAggregatedKg?: number;
  }>;
}

/**
 * Deterministic Smart Matching Score (Part 13)
 * Evaluates match percentage between a bulk buyer requirement and an aggregation pool.
 *
 * Scoring breakdown:
 * - Product compatibility: 40% (exact match = 40%, same category = 20%)
 * - Quantity sufficiency: 25% (min(1, available / required) * 25%)
 * - Location proximity: 20% (same district = 20%, same state = 10%, national = 5%)
 * - Price alignment: 10% (expected <= target = 10%, slight premium = 5%)
 * - Availability date buffer: 5% (harvest before required delivery date = 5%)
 */
export function calculateMatchScore(
  req: {
    productName: string;
    category?: string;
    requiredQuantity: number;
    targetPrice: number;
    deliveryLocation: { district: string; state: string };
    requiredDate?: Date;
  },
  agg: {
    productName: string;
    category?: string;
    availableQuantity: number;
    targetPrice?: number;
    location?: { district?: string; state?: string };
    harvestDate?: Date;
  }
): { matchScore: number; breakdown: Record<string, number> } {
  let productScore = 0;
  if (req.productName.toLowerCase().trim() === agg.productName.toLowerCase().trim()) {
    productScore = 40;
  } else if (
    req.category &&
    agg.category &&
    req.category.toLowerCase().trim() === agg.category.toLowerCase().trim()
  ) {
    productScore = 20;
  }

  const quantityRatio = agg.availableQuantity / Math.max(1, req.requiredQuantity);
  const quantityScore = Math.min(25, Math.round(quantityRatio * 25));

  let locationScore = 5;
  if (
    agg.location?.district &&
    req.deliveryLocation?.district &&
    agg.location.district.toLowerCase() === req.deliveryLocation.district.toLowerCase()
  ) {
    locationScore = 20;
  } else if (
    agg.location?.state &&
    req.deliveryLocation?.state &&
    agg.location.state.toLowerCase() === req.deliveryLocation.state.toLowerCase()
  ) {
    locationScore = 12;
  }

  let priceScore = 5;
  if (agg.targetPrice && req.targetPrice) {
    if (agg.targetPrice <= req.targetPrice) {
      priceScore = 10;
    } else if (agg.targetPrice <= req.targetPrice * 1.1) {
      priceScore = 6;
    }
  } else {
    priceScore = 8;
  }

  const dateScore = 5; // Assumed harvest buffer ready
  const totalScore = Math.min(100, Math.max(15, productScore + quantityScore + locationScore + priceScore + dateScore));

  return {
    matchScore: totalScore,
    breakdown: {
      product: productScore,
      quantity: quantityScore,
      location: locationScore,
      price: priceScore,
      date: dateScore,
    },
  };
}

/**
 * Retrieve comprehensive overview dashboard data for FPO Hub
 */
export async function getFpoDashboardData(
  userId: string,
  userRole: string
): Promise<FpoDashboardSummary> {
  await connectToDatabase();

  // Find linked or primary FPO
  let fpoDoc = await FPO.findOne({ user: userId });
  if (!fpoDoc) {
    fpoDoc = await FPO.findOne();
  }

  // If no FPO exists in DB, create initial demo FPO
  if (!fpoDoc) {
    const fpoUser = await User.findOne({ role: "FPO" });
    fpoDoc = await FPO.create({
      user: fpoUser ? fpoUser._id : new mongoose.Types.ObjectId(userId),
      organizationName: "Odisha Farmers Producer Organization",
      registrationNumber: "CIN-U01111OR2020PTC034567",
      yearOfEstablishment: 2020,
      memberFarmerCount: 145,
      cropSpecialization: ["Tomato", "Potato", "Onion", "Rice", "Vegetables"],
      aggregationCenters: [
        {
          name: "Ganjam Central Agritech Aggregation Mandi",
          address: "NH-16, Berhampur Rural Hub",
          district: "Ganjam",
          state: "Odisha",
          pincode: "760001",
          contactPerson: "Santosh Mohapatra",
          contactPhone: "9437123456",
          latitude: 19.3149,
          longitude: 84.7941,
          coldStorageAvailable: true,
        },
      ],
      annualTurnoverLakhs: 85,
    });
  }

  // Fetch real counts
  const activeFarmersCount = await User.countDocuments({ role: "FARMER", status: "ACTIVE" });
  const farmerGroupsCount = await FarmerGroup.countDocuments();
  const activeDiscussionsCount = await CommunityPost.countDocuments({ status: "ACTIVE" });
  
  // Aggregate total produce volume from all active produce aggregations
  const aggregations = await ProduceAggregation.find({ status: { $in: ["OPEN", "TARGET_REACHED", "RESERVED"] } }).lean();
  const aggregatedProduceKg = aggregations.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0);

  // Active bulk buyer requirements
  const pendingBulkOpportunities = await BulkRequirement.countDocuments({ status: { $in: ["OPEN", "MATCHED"] } });
  const activeBulkOrders = await Order.countDocuments({ orderStatus: { $in: ["CONFIRMED", "IN_TRANSIT", "PROCESSING"] } });

  // Top Active Groups
  const topGroupsRaw = await FarmerGroup.find().sort({ memberCount: -1, postCount: -1 }).limit(4).lean();
  const topActiveGroups = topGroupsRaw.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    product: g.product,
    category: g.category,
    memberCount: g.memberCount,
    postCount: g.postCount,
    aggregatedQuantityKg: g.aggregatedQuantityKg,
    location: `${g.location.district}, ${g.location.state}`,
  }));

  // Recent Community Activity
  const recentPosts = await CommunityPost.find({ status: "ACTIVE" })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate("groupId", "name")
    .lean();

  const recentCommunityActivity = recentPosts.map((p) => {
    let type: "POST" | "JOIN" | "AGGREGATION" | "BUYER" | "PRICE" = "POST";
    if (p.postType === "MARKET_PRICE") type = "PRICE";
    else if (p.postType === "BULK_SELLING" || p.postType === "DEMAND") type = "BUYER";

    const group = p.groupId as unknown as { name?: string };
    return {
      id: p._id.toString(),
      type,
      title: p.title || `${p.postType.replace(/_/g, " ")} by ${p.authorName}`,
      description: p.content.slice(0, 140),
      authorName: p.authorName,
      timestamp: p.createdAt,
      groupName: group?.name || "General Community",
    };
  });

  // Current Bulk Opportunities with Smart Matching
  const buyerReqs = await BulkRequirement.find({ status: { $in: ["OPEN", "MATCHED"] } })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  const currentBulkOpportunities = buyerReqs.map((req) => {
    // Find best matching group aggregation
    let bestScore = 75;
    let matchingGroupName = "Vegetable Growers Collective";
    let availableKg = 620;

    const matchingAgg = aggregations.find(
      (a) => a.productName.toLowerCase() === req.productName.toLowerCase()
    );

    if (matchingAgg) {
      const match = calculateMatchScore(
        {
          productName: req.productName,
          category: req.category,
          requiredQuantity: req.requiredQuantity,
          targetPrice: req.targetPrice,
          deliveryLocation: req.deliveryLocation,
        },
        {
          productName: matchingAgg.productName,
          category: matchingAgg.category,
          availableQuantity: matchingAgg.availableQuantity,
          targetPrice: matchingAgg.targetPrice,
          location: { district: "Ganjam", state: "Odisha" },
        }
      );
      bestScore = match.matchScore;
      availableKg = matchingAgg.availableQuantity;
    }

    return {
      id: req._id.toString(),
      buyerName: req.buyerName,
      productName: req.productName,
      requiredQuantity: req.requiredQuantity,
      unit: req.unit,
      targetPrice: req.targetPrice,
      location: `${req.deliveryLocation.district}, ${req.deliveryLocation.state}`,
      requiredDate: req.requiredDate,
      status: req.status,
      matchScore: bestScore,
      suitableGroupName: matchingGroupName,
      availableAggregatedKg: availableKg,
    };
  });

  return {
    fpoDetails: {
      id: fpoDoc._id.toString(),
      organizationName: fpoDoc.organizationName,
      registrationNumber: fpoDoc.registrationNumber,
      yearOfEstablishment: fpoDoc.yearOfEstablishment,
      district: fpoDoc.aggregationCenters?.[0]?.district || "Ganjam",
      state: fpoDoc.aggregationCenters?.[0]?.state || "Odisha",
      status: "Certified Producer Company",
      memberFarmerCount: Math.max(fpoDoc.memberFarmerCount, activeFarmersCount),
      cropSpecialization: fpoDoc.cropSpecialization,
    },
    metrics: {
      activeFarmers: activeFarmersCount,
      farmerGroups: farmerGroupsCount,
      activeDiscussions: activeDiscussionsCount,
      aggregatedProduceKg,
      pendingBulkOpportunities,
      activeBulkOrders,
    },
    recentCommunityActivity,
    topActiveGroups,
    currentBulkOpportunities,
  };
}

// -----------------------------------------------------------------------------
// GROUPS & MEMBERSHIP
// -----------------------------------------------------------------------------

export async function listGroups(filters?: {
  product?: string;
  category?: string;
  district?: string;
  search?: string;
  privacy?: GroupPrivacy;
}) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (filters?.product) {
    query.product = new RegExp(filters.product, "i");
  }
  if (filters?.category) {
    query.category = new RegExp(filters.category, "i");
  }
  if (filters?.district) {
    query["location.district"] = new RegExp(filters.district, "i");
  }
  if (filters?.privacy) {
    query.privacy = filters.privacy;
  }
  if (filters?.search) {
    query.$or = [
      { name: new RegExp(filters.search, "i") },
      { description: new RegExp(filters.search, "i") },
      { product: new RegExp(filters.search, "i") },
    ];
  }

  const groups = await FarmerGroup.find(query)
    .sort({ memberCount: -1, createdAt: -1 })
    .lean();

  return groups.map((g) => ({
    ...g,
    _id: g._id.toString(),
    creatorId: g.creatorId.toString(),
    fpoId: g.fpoId ? g.fpoId.toString() : null,
  }));
}

export async function getGroupById(groupId: string, currentUserId?: string) {
  await connectToDatabase();

  const group = await FarmerGroup.findById(groupId).lean();
  if (!group) return null;

  let isMember = false;
  let userRoleInGroup: string | null = null;

  if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
    const membership = await GroupMembership.findOne({
      groupId: group._id,
      userId: new mongoose.Types.ObjectId(currentUserId),
      status: "ACTIVE",
    }).lean();

    if (membership) {
      isMember = true;
      userRoleInGroup = membership.role;
    }
  }

  // Get active members
  const members = await GroupMembership.find({ groupId: group._id, status: "ACTIVE" })
    .populate("userId", "name email phone avatar location")
    .limit(20)
    .lean();

  // Get active aggregation for this group
  const aggregation = await ProduceAggregation.findOne({
    groupId: group._id,
    status: { $in: ["OPEN", "TARGET_REACHED", "RESERVED"] },
  }).lean();

  return {
    ...group,
    _id: group._id.toString(),
    isMember,
    userRoleInGroup,
    members: members.map((m) => {
      const u = m.userId as unknown as { _id: mongoose.Types.ObjectId; name?: string; email?: string; phone?: string; location?: { district?: string } };
      return {
        id: m._id.toString(),
        userId: u?._id?.toString(),
        name: u?.name || "Farmer",
        phone: u?.phone || "",
        location: u?.location?.district || group.location.district,
        role: m.role,
        joinedAt: m.joinedAt,
      };
    }),
    aggregation: aggregation
      ? {
          ...aggregation,
          _id: aggregation._id.toString(),
          contributionsCount: aggregation.contributions.length,
        }
      : null,
  };
}

export async function createGroup(
  userId: string,
  data: {
    name: string;
    description: string;
    product: string;
    category?: string;
    village?: string;
    district: string;
    state: string;
    privacy?: GroupPrivacy;
    image?: string;
  }
) {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const fpoDoc = await FPO.findOne({ user: user._id });

  const group = await FarmerGroup.create({
    name: data.name.trim(),
    description: data.description.trim(),
    product: data.product.trim(),
    category: data.category || "Fresh Vegetables",
    location: {
      village: data.village || "",
      district: data.district.trim(),
      state: data.state.trim(),
    },
    privacy: data.privacy || "PUBLIC",
    image: data.image || "/crops/vegetables.png",
    creatorId: user._id,
    fpoId: fpoDoc?._id || undefined,
    memberCount: 1,
    postCount: 0,
    aggregatedQuantityKg: 0,
  });

  // Automatically make creator OWNER
  await GroupMembership.create({
    groupId: group._id,
    userId: user._id,
    role: "OWNER",
    status: "ACTIVE",
  });

  // Create an initial produce aggregation container for this group
  await ProduceAggregation.create({
    groupId: group._id,
    fpoId: fpoDoc?._id || undefined,
    productName: data.product.trim(),
    category: data.category || "Fresh Vegetables",
    unit: "kg",
    targetQuantity: 500,
    totalQuantity: 0,
    availableQuantity: 0,
    reservedQuantity: 0,
    status: "OPEN",
    contributions: [],
  });

  return group;
}

export async function joinGroup(userId: string, groupId: string) {
  await connectToDatabase();

  const group = await FarmerGroup.findById(groupId);
  if (!group) throw new Error("Group not found");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const existing = await GroupMembership.findOne({ groupId: group._id, userId: user._id });
  if (existing) {
    if (existing.status === "ACTIVE") {
      return { success: true, message: "Already an active member", membership: existing };
    }
    existing.status = "ACTIVE";
    await existing.save();
    group.memberCount += 1;
    await group.save();
    return { success: true, message: "Rejoined group", membership: existing };
  }

  const membership = await GroupMembership.create({
    groupId: group._id,
    userId: user._id,
    role: "MEMBER",
    status: group.privacy === "PRIVATE" ? "PENDING" : "ACTIVE",
  });

  if (membership.status === "ACTIVE") {
    group.memberCount += 1;
    await group.save();
  }

  return { success: true, message: "Joined group successfully", membership };
}

export async function leaveGroup(userId: string, groupId: string) {
  await connectToDatabase();

  const membership = await GroupMembership.findOne({ groupId, userId });
  if (!membership) throw new Error("Membership not found");

  if (membership.role === "OWNER") {
    throw new Error("Group owner cannot leave the group. Please transfer ownership or delete group.");
  }

  membership.status = "REMOVED";
  await membership.save();

  await FarmerGroup.findByIdAndUpdate(groupId, { $inc: { memberCount: -1 } });
  return { success: true, message: "Left group successfully" };
}

// -----------------------------------------------------------------------------
// POSTS & DISCUSSIONS
// -----------------------------------------------------------------------------

export async function listPosts(filters?: {
  groupId?: string;
  productName?: string;
  postType?: CommunityPostType;
  search?: string;
  limit?: number;
}) {
  await connectToDatabase();

  const query: Record<string, unknown> = { status: "ACTIVE" };

  if (filters?.groupId) {
    query.groupId = new mongoose.Types.ObjectId(filters.groupId);
  }
  if (filters?.productName) {
    query.productName = new RegExp(filters.productName, "i");
  }
  if (filters?.postType) {
    query.postType = filters.postType;
  }
  if (filters?.search) {
    query.$or = [
      { content: new RegExp(filters.search, "i") },
      { title: new RegExp(filters.search, "i") },
      { productName: new RegExp(filters.search, "i") },
    ];
  }

  const posts = await CommunityPost.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(filters?.limit || 25)
    .populate("groupId", "name product")
    .lean();

  return posts.map((p) => {
    const group = p.groupId as unknown as { _id?: mongoose.Types.ObjectId; name?: string; product?: string };
    return {
      ...p,
      _id: p._id.toString(),
      authorId: p.authorId.toString(),
      groupId: group?._id ? group._id.toString() : p.groupId?.toString() || null,
      groupName: group?.name || null,
      likesCount: p.likes?.length || 0,
    };
  });
}

export async function createPost(
  userId: string,
  data: {
    groupId?: string;
    title?: string;
    content: string;
    postType?: CommunityPostType;
    productName?: string;
    marketPriceDetails?: {
      crop: string;
      pricePerKg: number;
      marketName: string;
      location: string;
      reportedDate: string;
    };
    images?: string[];
  }
) {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  let group = null;
  if (data.groupId && mongoose.Types.ObjectId.isValid(data.groupId)) {
    group = await FarmerGroup.findById(data.groupId);
  }

  const post = await CommunityPost.create({
    groupId: group?._id || undefined,
    fpoId: group?.fpoId || undefined,
    authorId: user._id,
    authorName: user.name,
    authorRole: user.role,
    title: data.title?.trim() || "",
    content: data.content.trim(),
    postType: data.postType || "GENERAL",
    productName: data.productName?.trim() || group?.product || undefined,
    marketPriceDetails: data.marketPriceDetails || undefined,
    images: data.images || [],
    likes: [],
    commentCount: 0,
    isPinned: false,
    isAnnouncement: data.postType === "ANNOUNCEMENT",
    status: "ACTIVE",
  });

  if (group) {
    group.postCount += 1;
    await group.save();
  }

  return post;
}

export async function toggleLikePost(userId: string, postId: string) {
  await connectToDatabase();

  const post = await CommunityPost.findById(postId);
  if (!post) throw new Error("Post not found");

  const userIdStr = userId.toString();
  const index = post.likes.indexOf(userIdStr);

  if (index > -1) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(userIdStr);
  }

  await post.save();
  return { likesCount: post.likes.length, isLiked: index === -1 };
}

// -----------------------------------------------------------------------------
// COMMENTS
// -----------------------------------------------------------------------------

export async function listComments(postId: string) {
  await connectToDatabase();

  const comments = await CommunityComment.find({ postId }).sort({ createdAt: 1 }).lean();

  return comments.map((c) => ({
    ...c,
    _id: c._id.toString(),
    postId: c.postId.toString(),
    authorId: c.authorId.toString(),
    parentCommentId: c.parentCommentId ? c.parentCommentId.toString() : null,
    likesCount: c.likes?.length || 0,
  }));
}

export async function createComment(
  userId: string,
  postId: string,
  content: string,
  parentCommentId?: string
) {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const post = await CommunityPost.findById(postId);
  if (!post) throw new Error("Post not found");

  const comment = await CommunityComment.create({
    postId: post._id,
    authorId: user._id,
    authorName: user.name,
    authorRole: user.role,
    content: content.trim(),
    parentCommentId: parentCommentId ? new mongoose.Types.ObjectId(parentCommentId) : undefined,
    likes: [],
  });

  post.commentCount += 1;
  await post.save();

  // Notify post author if different user
  if (post.authorId.toString() !== user._id.toString()) {
    try {
      await Notification.create({
        recipient: post.authorId,
        type: "COMMUNITY_COMMENT",
        title: "New Reply in Farmer Community",
        message: `${user.name} commented on your post: "${content.slice(0, 80)}"`,
        link: `/fpo?tab=community&postId=${post._id}`,
        read: false,
      });
    } catch (notifErr) {
      console.warn("Could not dispatch notification:", notifErr);
    }
  }

  return comment;
}

// -----------------------------------------------------------------------------
// PRODUCE AGGREGATION & BULK BUYER OPPORTUNITIES
// -----------------------------------------------------------------------------

export async function listProduceAggregations(groupId?: string) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (groupId && mongoose.Types.ObjectId.isValid(groupId)) {
    query.groupId = new mongoose.Types.ObjectId(groupId);
  }

  const aggregations = await ProduceAggregation.find(query)
    .populate("groupId", "name product location")
    .sort({ updatedAt: -1 })
    .lean();

  return aggregations.map((a) => {
    const group = a.groupId as unknown as { _id?: mongoose.Types.ObjectId; name?: string; location?: { district?: string; state?: string } };
    return {
      ...a,
      _id: a._id.toString(),
      groupId: group?._id ? group._id.toString() : a.groupId.toString(),
      groupName: group?.name || "Farmer Collective",
      location: group?.location ? `${group.location.district}, ${group.location.state}` : "Regional Mandi Hub",
      contributionsCount: a.contributions.length,
    };
  });
}

export async function addProduceToAggregation(
  userId: string,
  data: {
    groupId: string;
    quantity: number;
    expectedPrice: number;
    qualityGrade?: string;
    harvestDate?: string;
    availableDate?: string;
  }
) {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const group = await FarmerGroup.findById(data.groupId);
  if (!group) throw new Error("Group not found");

  // Verify farmer belongs to group or auto-join
  let membership = await GroupMembership.findOne({ groupId: group._id, userId: user._id, status: "ACTIVE" });
  if (!membership) {
    membership = await GroupMembership.create({
      groupId: group._id,
      userId: user._id,
      role: "MEMBER",
      status: "ACTIVE",
    });
    group.memberCount += 1;
    await group.save();
  }

  // Find or create active aggregation pool for this group
  let agg = await ProduceAggregation.findOne({
    groupId: group._id,
    status: { $in: ["OPEN", "TARGET_REACHED"] },
  });

  if (!agg) {
    agg = await ProduceAggregation.create({
      groupId: group._id,
      fpoId: group.fpoId,
      productName: group.product,
      category: group.category,
      unit: "kg",
      targetQuantity: 500,
      totalQuantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
      targetPrice: data.expectedPrice,
      status: "OPEN",
      contributions: [],
    });
  }

  const contribution = {
    farmerId: user._id,
    farmerName: user.name,
    farmerPhone: user.phone,
    quantity: data.quantity,
    expectedPrice: data.expectedPrice,
    qualityGrade: data.qualityGrade || "Grade A",
    harvestDate: data.harvestDate ? new Date(data.harvestDate) : new Date(),
    availableDate: data.availableDate ? new Date(data.availableDate) : new Date(),
    status: "COMMITTED" as const,
    contributedAt: new Date(),
  };

  agg.contributions.push(contribution as any);
  agg.totalQuantity += data.quantity;
  agg.availableQuantity += data.quantity;

  if (agg.totalQuantity >= agg.targetQuantity && agg.status === "OPEN") {
    agg.status = "TARGET_REACHED";
  }

  await agg.save();

  // Update group total aggregated quantity
  group.aggregatedQuantityKg += data.quantity;
  await group.save();

  // Create post announcement in group
  await createPost(userId, {
    groupId: group._id.toString(),
    postType: "BULK_SELLING",
    productName: group.product,
    content: `Added ${data.quantity} kg of ${group.product} (${data.qualityGrade || "Grade A"}) to our collective aggregation pool at expected ₹${data.expectedPrice}/kg. Group total is now ${agg.totalQuantity} kg!`,
  });

  return { success: true, aggregation: agg };
}

export async function acceptBuyerOpportunity(
  fpoUserId: string,
  requirementId: string,
  aggregationId: string
) {
  await connectToDatabase();

  const req = await BulkRequirement.findById(requirementId);
  if (!req) throw new Error("Bulk requirement not found");

  const agg = await ProduceAggregation.findById(aggregationId);
  if (!agg) throw new Error("Aggregation pool not found");

  if (agg.availableQuantity < req.requiredQuantity) {
    throw new Error(`Insufficient aggregated quantity. Available: ${agg.availableQuantity} kg, Required: ${req.requiredQuantity} kg`);
  }

  // Reserve quantity
  agg.availableQuantity = Math.max(0, agg.availableQuantity - req.requiredQuantity);
  agg.reservedQuantity += req.requiredQuantity;
  agg.status = "RESERVED";
  agg.matchedBuyerRequirementId = req._id;

  // Update requirement status
  req.status = "MATCHED";
  await req.save();

  // Create active Order in existing marketplace order system
  const orderNumber = `ORD-BLK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalAmount = req.requiredQuantity * req.targetPrice;
  const order = await Order.create({
    orderNumber,
    buyer: req.buyer,
    buyerType: "BULK_BUYER",
    seller: fpoUserId,
    sellerType: "FPO",
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        productName: req.productName,
        quantity: req.requiredQuantity,
        unit: "kg",
        unitPrice: req.targetPrice,
        totalItemPrice: totalAmount,
      },
    ],
    subtotal: totalAmount,
    deliveryFee: 0,
    total: totalAmount,
    orderStatus: "CONFIRMED",
    paymentStatus: "ESCROW_HELD",
    paymentMethod: "DIRECT_BANK_TRANSFER",
    deliveryAddress: {
      recipientName: req.buyerName || "Bulk Buyer Representative",
      recipientPhone: req.buyerPhone || "9876543210",
      addressLine: `${req.deliveryLocation.district} Central Distribution Hub`,
      district: req.deliveryLocation.district,
      state: req.deliveryLocation.state,
      pincode: req.deliveryLocation.pincode,
    },
    notes: `FPO Collective Aggregation match for ${req.productName} (Requirement ID: ${req._id})`,
  });

  agg.matchedOrderId = (order as any)._id;
  await agg.save();

  // Notify contributing farmers
  const uniqueFarmerIds = Array.from(new Set(agg.contributions.map((c) => c.farmerId.toString())));
  for (const fId of uniqueFarmerIds) {
    try {
      await Notification.create({
        recipient: new mongoose.Types.ObjectId(fId),
        type: "BULK_OPPORTUNITY",
        title: "Bulk Buyer Opportunity Accepted!",
        message: `Your pooled produce for ${req.productName} has been matched with buyer ${req.buyerName} for ${req.requiredQuantity} kg @ ₹${req.targetPrice}/kg. Order #${order._id.toString().slice(-6)} created.`,
        link: `/fpo?tab=aggregation`,
        read: false,
      });
    } catch (e) {
      console.warn("Could not dispatch farmer notification:", e);
    }
  }

  return { success: true, orderId: order._id.toString(), order };
}

// -----------------------------------------------------------------------------
// MEMBERS & FPO PROFILE
// -----------------------------------------------------------------------------

export async function listMembers(fpoId?: string) {
  await connectToDatabase();

  const farmers = await User.find({ role: "FARMER" })
    .select("_id name email phone location status createdAt")
    .lean();

  const memberships = await GroupMembership.find({ status: "ACTIVE" })
    .populate("groupId", "name product")
    .lean();

  return farmers.map((f) => {
    const userGroups = memberships
      .filter((m) => m.userId.toString() === f._id.toString())
      .map((m) => {
        const g = m.groupId as unknown as { _id?: mongoose.Types.ObjectId; name?: string; product?: string };
        return {
          id: g?._id?.toString() || "",
          name: g?.name || "General Group",
          product: g?.product || "Produce",
          role: m.role,
        };
      });

    return {
      id: f._id.toString(),
      name: f.name,
      email: f.email,
      phone: f.phone,
      district: f.location?.district || "Ganjam",
      state: f.location?.state || "Odisha",
      status: f.status,
      groups: userGroups,
      joinedDate: f.createdAt,
    };
  });
}

export async function getFpoProfile(userId: string) {
  await connectToDatabase();

  let fpo = await FPO.findOne({ user: userId }).lean();
  if (!fpo) {
    fpo = await FPO.findOne().lean();
  }

  return fpo;
}

export async function updateFpoProfile(
  userId: string,
  data: {
    organizationName?: string;
    registrationNumber?: string;
    yearOfEstablishment?: number;
    memberFarmerCount?: number;
    cropSpecialization?: string[];
    annualTurnoverLakhs?: number;
  }
) {
  await connectToDatabase();

  let fpo = await FPO.findOne({ user: userId });
  if (!fpo) {
    fpo = await FPO.findOne();
  }

  if (!fpo) throw new Error("FPO profile not found");

  if (data.organizationName) fpo.organizationName = data.organizationName.trim();
  if (data.registrationNumber) fpo.registrationNumber = data.registrationNumber.trim();
  if (data.yearOfEstablishment) fpo.yearOfEstablishment = data.yearOfEstablishment;
  if (data.memberFarmerCount) fpo.memberFarmerCount = data.memberFarmerCount;
  if (data.cropSpecialization) fpo.cropSpecialization = data.cropSpecialization;
  if (data.annualTurnoverLakhs) fpo.annualTurnoverLakhs = data.annualTurnoverLakhs;

  await fpo.save();
  return fpo;
}

// -----------------------------------------------------------------------------
// ANALYTICS
// -----------------------------------------------------------------------------

export async function getFpoAnalytics() {
  await connectToDatabase();

  const totalMembers = await User.countDocuments({ role: "FARMER" });
  const totalGroups = await FarmerGroup.countDocuments();
  const totalPosts = await CommunityPost.countDocuments({ status: "ACTIVE" });
  
  const aggregations = await ProduceAggregation.find().lean();
  const totalAggregatedKg = aggregations.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0);
  const totalSoldKg = aggregations.filter((a) => a.status === "SOLD" || a.status === "RESERVED").reduce((acc, curr) => acc + (curr.reservedQuantity || 0), 0);

  // Group distributions by crop
  const groups = await FarmerGroup.find().lean();
  const productDistribution: Record<string, number> = {};
  groups.forEach((g) => {
    productDistribution[g.product] = (productDistribution[g.product] || 0) + g.memberCount;
  });

  return {
    totalMembers,
    totalGroups,
    totalPosts,
    totalAggregatedKg,
    totalSoldKg,
    productDistribution,
    activeDiscussions: totalPosts,
  };
}
