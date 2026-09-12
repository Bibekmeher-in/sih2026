import { z } from "zod";

export const PUBLIC_REGISTRATION_ROLES = [
  "FARMER",
  "FPO",
  "CONSUMER",
  "BULK_BUYER",
  "DELIVERY_PARTNER",
] as const;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  role: z.enum(PUBLIC_REGISTRATION_ROLES, {
    message: "Please select a valid role (Farmer, FPO, Consumer, Bulk Buyer, or Delivery Partner)",
  }),
  district: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
});

export const produceSchema = z.object({
  name: z.string().min(2, "Produce name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.enum(["kg", "quintal", "ton", "crate"]),
  pricePerUnit: z.number().positive("Price must be positive"),
  harvestDate: z.string().min(1, "Harvest date is required"),
  grade: z.enum(["A", "B", "Premium Organic"]).default("A"),
  description: z.string().optional(),
});

export const orderCreateSchema = z.object({
  produceId: z.string().min(1, "Produce ID is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  deliveryAddress: z.string().min(5, "Delivery address is required"),
  buyerType: z.enum(["consumer", "bulk_buyer"]),
});

export const farmerProductFormSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(100),
  hindiName: z.string().trim().optional(),
  variety: z.string().trim().optional(),
  category: z.string().trim().min(2, "Please select a valid category"),
  description: z.string().trim().min(10, "Please provide at least a brief 10-character description"),
  price: z.number().min(1, "Price must be at least ₹1 per unit"),
  mandiBenchmarkPrice: z.number().optional(),
  quantity: z.number().min(1, "Available quantity must be at least 1"),
  unit: z.enum(["kg", "quintal", "ton", "crate"], {
    message: "Select a valid measurement unit",
  }),
  qualityGrade: z.enum(["Grade A", "Grade B", "Premium Organic"], {
    message: "Select a quality grade",
  }),
  harvestDate: z.string().min(1, "Harvest date is required"),
  district: z.string().trim().min(2, "District is required"),
  state: z.string().trim().min(2, "State is required"),
  minimumOrderQuantity: z.number().min(1, "Minimum order quantity must be at least 1"),
  status: z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "ARCHIVED"]).optional(),
});

export const farmerProfileFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
  farmName: z.string().trim().min(2, "Farm name is required"),
  landAreaAcres: z.number().min(0.1, "Land area must be at least 0.1 acres"),
  irrigationType: z.enum(["Drip Irrigation", "Canal", "Rainfed", "Borewell", "Sprinkler"]),
  soilType: z.string().trim().min(2, "Soil type is required"),
  primaryCrops: z.string().trim().min(2, "Enter primary crops separated by comma"),
  district: z.string().trim().min(2, "District is required"),
  state: z.string().trim().min(2, "State is required"),
  bankAccountName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankIfscCode: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProduceInput = z.infer<typeof produceSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type FarmerProductFormInput = z.infer<typeof farmerProductFormSchema>;
export type FarmerProfileFormInput = z.infer<typeof farmerProfileFormSchema>;

export const checkoutFormSchema = z.object({
  recipientName: z.string().trim().min(2, "Recipient name is required"),
  recipientPhone: z.string().trim().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  addressLine: z.string().trim().min(5, "Complete address line is required"),
  district: z.string().trim().min(2, "District is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Valid 6-digit PIN code required"),
  paymentMethod: z.enum(
    [
      "CARD",
      "UPI",
      "NETBANKING",
      "WALLET",
      "CASH_ON_DELIVERY",
      "DIRECT_BANK_TRANSFER",
      "NET_BANKING",
      "OTHER",
    ],
    {
      message: "Select a valid payment option",
    }
  ),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive(),
      })
    )
    .min(1, "Cart cannot be empty"),
});

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

export const reviewFormSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  orderId: z.string().optional(),
  rating: z.number().min(1).max(5),
  freshnessScore: z.number().min(1).max(5),
  packagingScore: z.number().min(1).max(5),
  comment: z.string().trim().min(5, "Comment must be at least 5 characters"),
});

export type ReviewFormInput = z.infer<typeof reviewFormSchema>;

export const bulkRequirementFormSchema = z.object({
  productName: z.string().trim().min(2, "Crop / Produce name is required"),
  category: z.string().trim().min(2, "Category is required"),
  requiredQuantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.enum(["kg", "quintal", "ton"], {
    message: "Select a valid wholesale unit (kg, quintal, ton)",
  }),
  targetPrice: z.number().min(1, "Target price must be greater than 0"),
  requiredDate: z.string().min(1, "Required delivery date is required"),
  district: z.string().trim().min(2, "Destination district is required"),
  state: z.string().trim().min(2, "Destination state is required"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Valid 6-digit PIN code required"),
  deliveryHubName: z.string().trim().optional(),
  qualityPreference: z.enum(["Grade A", "Grade B", "Premium Organic"]).optional(),
  notes: z.string().trim().optional(),
});

export type BulkRequirementFormInput = z.infer<typeof bulkRequirementFormSchema>;

export const deliveryPartnerOnboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
  vehicleType: z.enum(["BIKE", "SCOOTER", "THREE_WHEELER", "MINI_TRUCK", "TRUCK", "OTHER"]),
  vehicleNumber: z.string().trim().min(5, "Valid vehicle registration number is required"),
  vehicleCapacityKg: z.number().min(5, "Capacity must be at least 5 kg"),
  governmentIdType: z.enum(["AADHAAR", "PAN", "VOTER_ID"]).default("AADHAAR"),
  governmentIdNumber: z.string().trim().min(4, "ID number is required"),
  drivingLicenseNumber: z.string().trim().min(5, "Driving license number is required"),
  drivingLicenseExpiry: z.string().optional(),
  vehicleRegistrationNumber: z.string().trim().min(5, "RC number is required"),
  insuranceExpiry: z.string().optional(),
  city: z.string().trim().min(2, "Operating city/district is required"),
  radiusKm: z.number().min(5).max(200).default(30),
});

export type DeliveryPartnerOnboardingInput = z.infer<typeof deliveryPartnerOnboardingSchema>;

export const deliveryLocationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional().default(10),
});

export type DeliveryLocationUpdateInput = z.infer<typeof deliveryLocationUpdateSchema>;

export const deliveryAssignmentActionSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
  reason: z.string().trim().optional(),
});

export type DeliveryAssignmentActionInput = z.infer<typeof deliveryAssignmentActionSchema>;

export const deliveryStatusTransitionSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "ARRIVED_AT_PICKUP",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "ARRIVED_AT_DESTINATION",
    "DELIVERED",
    "FAILED",
  ]),
  otpCode: z.string().trim().optional(),
  note: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type DeliveryStatusTransitionInput = z.infer<typeof deliveryStatusTransitionSchema>;

export const aiAssignmentDecisionSchema = z.object({
  recommendedPartnerId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  rankedCandidates: z.array(
    z.object({
      partnerId: z.string(),
      score: z.number().min(0).max(100),
      reason: z.string(),
      breakdown: z.object({
        proximityScore: z.number().optional(),
        capacityScore: z.number().optional(),
        workloadScore: z.number().optional(),
        freshnessScore: z.number().optional(),
      }).optional(),
    })
  ),
});

export type AiAssignmentDecision = z.infer<typeof aiAssignmentDecisionSchema>;
