import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Order, OrderStatusType, PaymentStatusType, IOrderStatusHistoryItem } from "@/models/Order";
import { Delivery } from "@/models/Delivery";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";
import { Notification, NotificationType } from "@/models/Notification";
import { User } from "@/models/User";

/**
 * Finite State Machine for Order Status Transitions
 */
export const VALID_ORDER_STATUSES: OrderStatusType[] = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "ASSIGNED_FOR_DELIVERY",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export const VALID_STATUS_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["PICKED_UP", "ASSIGNED_FOR_DELIVERY", "CANCELLED"],
  ASSIGNED_FOR_DELIVERY: ["PICKED_UP", "IN_TRANSIT", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export interface OrderCreationItemInput {
  productId: string;
  quantity: number;
}

export interface OrderDeliveryAddressInput {
  recipientName?: string;
  recipientPhone?: string;
  addressLine?: string;
  address?: string;
  district: string;
  state: string;
  pincode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CreateOrderParams {
  userId: string;
  items: OrderCreationItemInput[];
  deliveryAddress: OrderDeliveryAddressInput;
  buyerType?: "CONSUMER" | "BULK_BUYER";
  paymentMethod?:
    | "CARD"
    | "UPI"
    | "NETBANKING"
    | "WALLET"
    | "CASH_ON_DELIVERY"
    | "DIRECT_BANK_TRANSFER"
    | "NET_BANKING"
    | "OTHER";
  isOnlinePayment?: boolean;
  razorpayOrderId?: string;
  existingOrderId?: string;
  notes?: string;
  autoConfirm?: boolean; // For verified instant checkout
}

export class OrderEngineError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "ORDER_ENGINE_ERROR") {
    super(message);
    this.name = "OrderEngineError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Helper: Calculate Haversine distance in kilometers
 */
function calculateDistanceKm(
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
  return Math.max(1, Math.round(R * c * 10) / 10);
}

/**
 * Helper to dispatch notification record to MongoDB
 */
export async function sendOrderNotification({
  recipientId,
  type,
  title,
  message,
  link,
  metadata,
}: {
  recipientId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId.toString())) {
      return null;
    }
    return await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link: link || "",
      read: false,
      metadata: metadata || {},
    });
  } catch (err) {
    console.warn("Failed to dispatch order notification:", err);
    return null;
  }
}

/**
 * Default explanatory notes for each order status
 */
function getDefaultStatusNote(status: OrderStatusType): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Order initiated. Awaiting payment authorization.";
    case "PAYMENT_FAILED":
      return "Payment authorization failed. Inventory released.";
    case "PENDING":
      return "Order placed by buyer. Awaiting seller confirmation.";
    case "CONFIRMED":
      return "Order confirmed. Produce reserved for packing.";
    case "PROCESSING":
      return "Order is being prepared, graded, and packaged at farm gate.";
    case "READY_FOR_PICKUP":
      return "Order is packaged and ready at dispatch bay for logistics fleet.";
    case "ASSIGNED_FOR_DELIVERY":
      return "Logistics carrier assigned. Vehicle en route to pickup hub.";
    case "PICKED_UP":
      return "Order collected from farm gate cluster by cold-chain logistics.";
    case "IN_TRANSIT":
      return "Order is in transit with logistics carrier.";
    case "OUT_FOR_DELIVERY":
      return "Driver has departed local hub and is out for doorstep delivery.";
    case "DELIVERED":
      return "Order safely delivered and verified.";
    case "CANCELLED":
      return "Order cancelled.";
    default:
      return "";
  }
}

/**
 * 12-Step Robust Order Creation Pipeline with Inventory Reservation & Delivery Linkage
 * Zero-trust architecture: completely recalculates price, subtotal, delivery fee, and seller info server-side.
 */
export async function createOrder(params: CreateOrderParams) {
  await connectToDatabase();

  const {
    userId,
    items,
    deliveryAddress,
    buyerType = "CONSUMER",
    paymentMethod = "UPI",
    notes = "",
    autoConfirm = true,
    isOnlinePayment = false,
    razorpayOrderId,
    existingOrderId,
  } = params;

  // 1. Authenticate user
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new OrderEngineError("Authentication required to place an order", 401, "UNAUTHORIZED");
  }

  const buyerUser = await User.findById(userId);
  if (!buyerUser) {
    throw new OrderEngineError("Authenticated user record not found", 401, "USER_NOT_FOUND");
  }

  // Check for reusable existing pending order (to avoid duplicate order creation on payment retry)
  if (existingOrderId && mongoose.Types.ObjectId.isValid(existingOrderId)) {
    const existing = await Order.findById(existingOrderId);
    if (
      existing &&
      existing.buyer.toString() === userId &&
      existing.orderStatus === "PENDING_PAYMENT" &&
      existing.inventoryReservationExpiresAt &&
      existing.inventoryReservationExpiresAt > new Date()
    ) {
      if (razorpayOrderId && !existing.razorpayOrderId) {
        existing.razorpayOrderId = razorpayOrderId;
        await existing.save();
      }
      return {
        success: true,
        order: {
          _id: existing._id.toString(),
          orderNumber: existing.orderNumber,
          subtotal: existing.subtotal,
          deliveryFee: existing.deliveryFee,
          total: existing.total,
          orderStatus: existing.orderStatus,
          status: existing.orderStatus,
          paymentStatus: existing.paymentStatus,
          itemsCount: existing.items.length,
          deliveryId: existing.deliveryId?.toString(),
          deliveryOtp: existing.deliveryOtp,
          statusHistory: existing.statusHistory,
          razorpayOrderId: existing.razorpayOrderId,
          inventoryReservationExpiresAt: existing.inventoryReservationExpiresAt,
          createdAt: existing.createdAt,
        },
      };
    }
  }

  // 2. Validate cart
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderEngineError("Cart cannot be empty. At least one product is required", 400, "EMPTY_CART");
  }

  for (const item of items) {
    if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new OrderEngineError(
        `Invalid product ID supplied: ${item.productId}`,
        400,
        "INVALID_PRODUCT_ID"
      );
    }
    if (typeof item.quantity !== "number" || item.quantity <= 0 || isNaN(item.quantity)) {
      throw new OrderEngineError(
        `Invalid quantity for product ${item.productId}. Must be greater than 0`,
        400,
        "INVALID_QUANTITY"
      );
    }
  }

  // 3. Fetch products from MongoDB & 4. Verify product availability & 5. Verify quantity
  const verifiedItems: Array<{
    product: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    unit: "kg" | "quintal" | "ton" | "crate";
    unitPrice: number;
    totalItemPrice: number;
    qualityGrade: string;
    sellerId: mongoose.Types.ObjectId;
    sellerType: "User" | "FarmerProfile" | "FPO";
    productLocation?: {
      district?: string;
      state?: string;
      coordinates?: { latitude: number; longitude: number };
    };
  }> = [];

  let primarySellerId: mongoose.Types.ObjectId | null = null;
  let primarySellerType: "User" | "FarmerProfile" | "FPO" = "User";
  let sellerDistrict = "Cuttack";
  let sellerState = "Odisha";
  let sellerCoordinates = { latitude: 20.4625, longitude: 85.8828 };

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new OrderEngineError(
        `Product with ID ${item.productId} was not found in catalog`,
        404,
        "PRODUCT_NOT_FOUND"
      );
    }

    if (product.status === "ARCHIVED") {
      throw new OrderEngineError(
        `Product "${product.name}" is no longer available for order`,
        400,
        "PRODUCT_ARCHIVED"
      );
    }

    if (product.availableQuantity < item.quantity) {
      throw new OrderEngineError(
        `Insufficient inventory for "${product.name}". Available: ${product.availableQuantity} ${product.unit}, requested: ${item.quantity} ${product.unit}`,
        409,
        "INSUFFICIENT_INVENTORY"
      );
    }

    // 6. Calculate price server-side (Zero trust on client price)
    const unitPrice = product.price;
    const totalItemPrice = Math.round(unitPrice * item.quantity * 100) / 100;

    if (!primarySellerId && product.seller) {
      primarySellerId = product.seller as mongoose.Types.ObjectId;
      primarySellerType = product.sellerType || "User";
      if (product.location) {
        sellerDistrict = product.location.district || sellerDistrict;
        sellerState = product.location.state || sellerState;
        if (product.location.coordinates?.latitude && product.location.coordinates?.longitude) {
          sellerCoordinates = {
            latitude: product.location.coordinates.latitude,
            longitude: product.location.coordinates.longitude,
          };
        }
      }
    }

    verifiedItems.push({
      product: product._id as mongoose.Types.ObjectId,
      productName: product.name,
      quantity: item.quantity,
      unit: product.unit,
      unitPrice,
      totalItemPrice,
      qualityGrade: product.qualityGrade || "Grade A",
      sellerId: (product.seller as mongoose.Types.ObjectId) || primarySellerId || buyerUser._id,
      sellerType: product.sellerType || "User",
      productLocation: product.location,
    });
  }

  // 7. Calculate subtotal server-side
  const subtotal = verifiedItems.reduce((acc, curr) => acc + curr.totalItemPrice, 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // 8. Calculate delivery fee server-side
  let deliveryFee = 0;
  if (buyerType === "CONSUMER") {
    // Consumer: Free delivery above ₹500, else flat ₹40
    deliveryFee = roundedSubtotal >= 500 ? 0 : 40;
  } else {
    // Bulk freight: Free freight above ₹25,000, else flat ₹500 dispatch fee
    deliveryFee = roundedSubtotal >= 25000 ? 0 : 500;
  }

  // 9. Calculate total server-side
  const grandTotal = Math.round((roundedSubtotal + deliveryFee) * 100) / 100;

  // 10. Reserve inventory atomically (Prevent overselling)
  const successfullyReserved: Array<{ productId: mongoose.Types.ObjectId; quantity: number }> = [];

  try {
    for (const item of verifiedItems) {
      // Atomic conditional update
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          availableQuantity: { $gte: item.quantity },
        },
        {
          $inc: { availableQuantity: -item.quantity },
        },
        { returnDocument: "after" }
      );

      if (!updatedProduct) {
        throw new OrderEngineError(
          `Failed to reserve inventory for "${item.productName}". Stock may have changed concurrently.`,
          409,
          "INVENTORY_RESERVATION_FAILED"
        );
      }

      // Update product status
      if (updatedProduct.availableQuantity <= 0) {
        updatedProduct.status = "OUT_OF_STOCK";
        await updatedProduct.save();
      } else if (updatedProduct.availableQuantity < 10 && updatedProduct.status !== "LOW_STOCK") {
        updatedProduct.status = "LOW_STOCK";
        await updatedProduct.save();
      }

      // Synchronize dedicated Inventory collection
      let invDoc = await Inventory.findOne({ product: item.product });
      if (invDoc) {
        invDoc.reservedQuantity += item.quantity;
        invDoc.availableQuantity = Math.max(0, invDoc.currentQuantity - invDoc.reservedQuantity);
        invDoc.lastStockUpdate = new Date();
        await invDoc.save();
      } else {
        invDoc = await Inventory.create({
          product: item.product,
          currentQuantity: updatedProduct.availableQuantity + item.quantity,
          reservedQuantity: item.quantity,
          availableQuantity: updatedProduct.availableQuantity,
          unit: item.unit,
        });
      }

      successfullyReserved.push({ productId: item.product, quantity: item.quantity });
    }
  } catch (reservationError) {
    // Compensating rollback
    for (const res of successfullyReserved) {
      await Product.findByIdAndUpdate(res.productId, {
        $inc: { availableQuantity: res.quantity },
        $set: { status: "AVAILABLE" },
      });
      const invDoc = await Inventory.findOne({ product: res.productId });
      if (invDoc) {
        invDoc.reservedQuantity = Math.max(0, invDoc.reservedQuantity - res.quantity);
        invDoc.availableQuantity = Math.max(0, invDoc.currentQuantity - invDoc.reservedQuantity);
        await invDoc.save();
      }
    }
    throw reservationError;
  }

  // 11. Generate unique human-readable order number
  const orderPrefix = buyerType === "BULK_BUYER" ? "KD-BLK" : "KD-CON";
  const uniqueSuffix = `${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderNumber = `${orderPrefix}-${uniqueSuffix}`;

  // Strict check: Cash on Delivery vs Online Payment
  const isCOD = paymentMethod === "CASH_ON_DELIVERY";
  const isOnline = !isCOD || Boolean(isOnlinePayment);

  // Online payments MUST NEVER be marked CONFIRMED upfront.
  // COD is confirmed for logistics pickup with paymentStatus = PENDING.
  const initialStatus: OrderStatusType = isOnline ? "PENDING_PAYMENT" : "CONFIRMED";
  const initialPayment: PaymentStatusType = isOnline ? "CREATED" : "PENDING";
  const inventoryReservationExpiresAt = isOnline ? new Date(Date.now() + 15 * 60 * 1000) : undefined;
  const inventoryConsumed = isCOD;

  // Generate 4-digit Delivery Confirmation OTP
  const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

  // Initial status history
  const statusHistory: IOrderStatusHistoryItem[] = isOnline
    ? [
        {
          status: "PENDING_PAYMENT",
          timestamp: new Date(),
          note: "Order placed. Awaiting Razorpay payment authorization.",
        },
      ]
    : [
        {
          status: "CONFIRMED",
          timestamp: new Date(),
          note: "Order placed with Cash on Delivery. Produce reserved for dispatch.",
        },
      ];

  // Estimated delivery time: 24h for consumer, 48h for bulk
  const estimatedDeliveryHours = buyerType === "BULK_BUYER" ? 48 : 24;
  const estimatedDeliveryAt = new Date(Date.now() + estimatedDeliveryHours * 3600 * 1000);

  // Parse destination coordinates (default to Bhubaneswar if missing)
  const destCoords = {
    latitude: deliveryAddress.coordinates?.latitude || 20.2961,
    longitude: deliveryAddress.coordinates?.longitude || 85.8245,
  };

  // 12. Create Order in MongoDB
  const order = await Order.create({
    orderNumber,
    buyer: buyerUser._id,
    buyerType,
    seller: primarySellerId || buyerUser._id,
    sellerType: primarySellerType,
    items: verifiedItems.map((vi) => ({
      product: vi.product,
      productName: vi.productName,
      quantity: vi.quantity,
      unit: vi.unit,
      unitPrice: vi.unitPrice,
      totalItemPrice: vi.totalItemPrice,
      qualityGrade: vi.qualityGrade,
    })),
    subtotal: roundedSubtotal,
    deliveryFee,
    total: grandTotal,
    deliveryAddress: {
      recipientName: deliveryAddress.recipientName || buyerUser.name || "Customer",
      recipientPhone: deliveryAddress.recipientPhone || buyerUser.phone || "9876543210",
      addressLine: deliveryAddress.addressLine || deliveryAddress.address || "Address details provided",
      district: deliveryAddress.district || "Bhubaneswar",
      state: deliveryAddress.state || "Odisha",
      pincode: deliveryAddress.pincode || "751001",
      coordinates: destCoords,
    },
    orderStatus: initialStatus,
    paymentStatus: initialPayment,
    paymentMethod,
    razorpayOrderId: params.razorpayOrderId,
    currency: "INR",
    inventoryReservationExpiresAt,
    inventoryConsumed,
    statusHistory,
    deliveryOtp,
    estimatedDeliveryAt,
    notes,
  });

  // 13. Create corresponding linked Delivery record
  const distKm = calculateDistanceKm(
    sellerCoordinates.latitude,
    sellerCoordinates.longitude,
    destCoords.latitude,
    destCoords.longitude
  );
  const durationMin = Math.round(distKm * 2.2);

  const deliveryTrackingNumber = `DEL-TRK-${orderNumber.replace(/[^0-9]/g, "").slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  try {
    const delivery = await Delivery.create({
      deliveryTrackingNumber,
      order: order._id,
      pickupLocation: {
        name: `${sellerDistrict} Farm Gate Hub`,
        address: `Village Badamba, ${sellerDistrict}`,
        district: sellerDistrict,
        state: sellerState,
        latitude: sellerCoordinates.latitude,
        longitude: sellerCoordinates.longitude,
        contactPhone: "9822012345",
      },
      destination: {
        name: deliveryAddress.recipientName || buyerUser.name || "Customer",
        address: deliveryAddress.addressLine || deliveryAddress.address || "Address details provided",
        district: deliveryAddress.district || "Bhubaneswar",
        state: deliveryAddress.state || "Odisha",
        latitude: destCoords.latitude,
        longitude: destCoords.longitude,
        contactPhone: deliveryAddress.recipientPhone || buyerUser.phone || "9876543210",
      },
      status: "PENDING_ASSIGNMENT",
      estimatedDistanceKm: distKm,
      estimatedDurationMinutes: durationMin,
      currentLocation: {
        latitude: sellerCoordinates.latitude,
        longitude: sellerCoordinates.longitude,
        updatedAt: new Date(),
      },
      otpCode: deliveryOtp,
      temperatureCelsius: 16.5,
    });

    // Link Delivery to Order
    order.deliveryId = delivery._id as mongoose.Types.ObjectId;
    await order.save();
  } catch (deliveryErr) {
    console.warn("Delivery record creation fallback:", deliveryErr);
  }

  // 14. Notifications
  // Notify Buyer
  await sendOrderNotification({
    recipientId: buyerUser._id,
    type: "ORDER_UPDATE",
    title: isOnline ? "Payment Initiated" : (autoConfirm ? "Order Confirmed!" : "Order Placed"),
    message: isOnline
      ? `Order #${order.orderNumber} for ₹${grandTotal} initiated. Please complete payment within 15 minutes.`
      : `Order #${order.orderNumber} for ₹${grandTotal} has been placed.`,
    link: buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`,
    metadata: { orderId: order._id, orderNumber: order.orderNumber },
  });

  // Notify Seller only if not online payment (or once confirmed)
  if (!isOnline && primarySellerId) {
    const produceNames = verifiedItems.map((vi) => `${vi.quantity} ${vi.unit} ${vi.productName}`).join(", ");
    await sendOrderNotification({
      recipientId: primarySellerId,
      type: "ORDER_UPDATE",
      title: "New Order Received!",
      message: `New order received for ${produceNames}. Order #${order.orderNumber}.`,
      link: `/farmer/orders`,
      metadata: { orderId: order._id, orderNumber: order.orderNumber },
    });
  }

  return {
    success: true,
    order: {
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      orderStatus: order.orderStatus,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      itemsCount: verifiedItems.length,
      deliveryId: order.deliveryId?.toString(),
      deliveryOtp: order.deliveryOtp,
      statusHistory: order.statusHistory,
      razorpayOrderId: order.razorpayOrderId,
      inventoryReservationExpiresAt: order.inventoryReservationExpiresAt,
      createdAt: order.createdAt,
    },
  };
}

/**
 * Strict Order Status Finite State Machine Transition
 */
export async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatusType,
  actor?: {
    userId?: string;
    role?: string;
    reason?: string;
    providedOtp?: string;
  }
) {
  await connectToDatabase();

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    throw new OrderEngineError("Invalid order ID provided", 400, "INVALID_ORDER_ID");
  }

  if (!VALID_ORDER_STATUSES.includes(newStatus)) {
    throw new OrderEngineError(`Invalid order status: ${newStatus}`, 400, "INVALID_STATUS");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new OrderEngineError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  const currentStatus = order.orderStatus;

  // Terminal states cannot be changed
  if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
    throw new OrderEngineError(
      `Cannot modify order in terminal state "${currentStatus}".`,
      400,
      "TERMINAL_STATE_MODIFICATION"
    );
  }

  // Check valid transition according to FSM
  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new OrderEngineError(
      `Invalid status transition: Cannot change order status from "${currentStatus}" to "${newStatus}". Allowed transitions: [${allowedNextStatuses.join(", ")}]`,
      400,
      "INVALID_STATUS_TRANSITION"
    );
  }

  // Role-based actor authorization checks
  if (actor) {
    const role = (actor.role || "").toUpperCase();
    const userId = actor.userId;

    // Buyer permissions
    if (role === "CONSUMER" || role === "BULK_BUYER") {
      if (newStatus !== "CANCELLED") {
        throw new OrderEngineError("Buyers can only request order cancellation", 403, "UNAUTHORIZED_TRANSITION");
      }
      if (userId && order.buyer.toString() !== userId) {
        throw new OrderEngineError("You do not have permission to modify this order", 403, "FORBIDDEN");
      }
      // "Buyer cancellation is allowed only before PROCESSING."
      if (currentStatus !== "PENDING" && currentStatus !== "CONFIRMED") {
        throw new OrderEngineError(
          `Cancellation is not allowed after processing has begun. Current status: ${currentStatus}`,
          400,
          "CANCELLATION_NOT_ALLOWED"
        );
      }
    }

    // Farmer / FPO permissions
    if (role === "FARMER" || role === "FPO") {
      if (userId && order.seller.toString() !== userId) {
        throw new OrderEngineError("You can only manage orders for your own farm produce", 403, "FORBIDDEN");
      }
      const allowedFarmerStatuses = ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "CANCELLED"];
      if (!allowedFarmerStatuses.includes(newStatus)) {
        throw new OrderEngineError(
          `Farmers/FPOs cannot set order status to "${newStatus}". Delivery dispatch is handled by Logistics.`,
          403,
          "UNAUTHORIZED_TRANSITION"
        );
      }
    }
  }

  // OTP Verification for Delivery
  if (newStatus === "DELIVERED") {
    if (actor?.providedOtp) {
      if (order.deliveryOtp && actor.providedOtp.trim() !== order.deliveryOtp.trim()) {
        throw new OrderEngineError("Invalid delivery confirmation OTP", 400, "INVALID_DELIVERY_OTP");
      }
      order.otpVerified = true;
    }
  }

  // 1. INVENTORY & PAYMENT ON CANCELLATION
  if (newStatus === "CANCELLED") {
    // Release inventory reservation
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { availableQuantity: item.quantity },
          $set: { status: "AVAILABLE" },
        });

        const invDoc = await Inventory.findOne({ product: item.product });
        if (invDoc) {
          invDoc.reservedQuantity = Math.max(0, invDoc.reservedQuantity - item.quantity);
          invDoc.availableQuantity = Math.max(0, invDoc.currentQuantity - invDoc.reservedQuantity);
          invDoc.lastStockUpdate = new Date();
          await invDoc.save();
        }
      }
    }

    order.orderStatus = "CANCELLED";
    order.paymentStatus = "REFUNDED";
    order.cancelledAt = new Date();
    if (actor?.reason) {
      order.notes = order.notes ? `${order.notes} | Cancelled: ${actor.reason}` : `Cancelled: ${actor.reason}`;
    }

    // Append to status history
    order.statusHistory.push({
      status: "CANCELLED",
      timestamp: new Date(),
      note: actor?.reason ? `Cancelled: ${actor.reason}` : "Order was cancelled",
    });

    await order.save();

    // Synchronize Delivery
    await Delivery.findOneAndUpdate(
      { order: order._id },
      { status: "FAILED" }
    );

    // Notify Buyer
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Cancelled",
      message: `Your order #${order.orderNumber} has been cancelled.`,
      link: order.buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: "CANCELLED" },
    });

    // Notify Seller
    if (order.seller) {
      await sendOrderNotification({
        recipientId: order.seller,
        type: "ORDER_UPDATE",
        title: "Order Cancelled",
        message: `Order #${order.orderNumber} was cancelled. Reserved produce released back to stock.`,
        link: `/farmer/orders`,
        metadata: { orderId: order._id, status: "CANCELLED" },
      });
    }

    return {
      success: true,
      message: "Order successfully cancelled and inventory reservation released",
      order,
    };
  }

  // 2. INVENTORY & ESCROW RELEASE ON DELIVERY
  if (newStatus === "DELIVERED") {
    // Consume reservation permanently
    for (const item of order.items) {
      if (item.product) {
        const invDoc = await Inventory.findOne({ product: item.product });
        if (invDoc) {
          invDoc.reservedQuantity = Math.max(0, invDoc.reservedQuantity - item.quantity);
          invDoc.currentQuantity = Math.max(0, invDoc.currentQuantity - item.quantity);
          invDoc.availableQuantity = Math.max(0, invDoc.currentQuantity - invDoc.reservedQuantity);
          invDoc.lastStockUpdate = new Date();
          await invDoc.save();
        }
      }
    }

    order.orderStatus = "DELIVERED";
    order.paymentStatus = "RELEASED_TO_SELLER";
    order.deliveredAt = new Date();

    order.statusHistory.push({
      status: "DELIVERED",
      timestamp: new Date(),
      note: actor?.reason || "Order has been safely delivered to buyer",
    });

    await order.save();

    // Synchronize Delivery
    await Delivery.findOneAndUpdate(
      { order: order._id },
      {
        status: "DELIVERED",
        actualDeliveryTime: new Date(),
        isOtpVerified: order.otpVerified,
      }
    );

    // Notify Buyer
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "DELIVERY_UPDATE",
      title: "Order Delivered!",
      message: `Your order #${order.orderNumber} has been delivered.`,
      link: order.buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: "DELIVERED" },
    });

    // Notify Seller
    if (order.seller) {
      await sendOrderNotification({
        recipientId: order.seller,
        type: "ORDER_UPDATE",
        title: "Order Delivered & Funds Released",
        message: `Order #${order.orderNumber} was marked as delivered. Payment of ₹${order.total} has been released from escrow.`,
        link: `/farmer/earnings`,
        metadata: { orderId: order._id, status: "DELIVERED" },
      });
    }

    return {
      success: true,
      message: "Order marked DELIVERED and payout released to seller",
      order,
    };
  }

  // 3. INTERMEDIATE STATUS TRANSITIONS
  order.orderStatus = newStatus;
  if (newStatus === "CONFIRMED") {
    order.paymentStatus = "PAID";
  }

  const note = actor?.reason || getDefaultStatusNote(newStatus);
  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
  });

  await order.save();

  // Synchronize Delivery document
  let deliveryStatus: string | null = null;
  if (newStatus === "READY_FOR_PICKUP" || newStatus === "ASSIGNED_FOR_DELIVERY") {
    deliveryStatus = "ASSIGNED";
  } else if (newStatus === "PICKED_UP") {
    deliveryStatus = "PICKED_UP";
  } else if (newStatus === "IN_TRANSIT") {
    deliveryStatus = "IN_TRANSIT";
  } else if (newStatus === "OUT_FOR_DELIVERY") {
    deliveryStatus = "OUT_FOR_DELIVERY";
  }

  if (deliveryStatus) {
    const updatePayload: Record<string, unknown> = { status: deliveryStatus };
    if (newStatus === "PICKED_UP") {
      updatePayload.actualPickupTime = new Date();
    }
    await Delivery.findOneAndUpdate({ order: order._id }, updatePayload);
  }

  // Notifications for intermediate states
  const buyerLink = order.buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`;

  if (newStatus === "CONFIRMED") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Confirmed",
      message: `Your order #${order.orderNumber} has been confirmed.`,
      link: buyerLink,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "PROCESSING") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Processing",
      message: `Your order #${order.orderNumber} is being prepared.`,
      link: buyerLink,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "READY_FOR_PICKUP") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Ready for Pickup",
      message: `Your order #${order.orderNumber} is ready for pickup.`,
      link: buyerLink,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "PICKED_UP") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "DELIVERY_UPDATE",
      title: "Order Picked Up",
      message: `Your order #${order.orderNumber} has been picked up.`,
      link: buyerLink,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "IN_TRANSIT") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "DELIVERY_UPDATE",
      title: "Order In Transit",
      message: `Your order #${order.orderNumber} is on the way.`,
      link: buyerLink,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "OUT_FOR_DELIVERY") {
    const otpMsg = order.deliveryOtp ? ` Delivery verification code: ${order.deliveryOtp}` : "";
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "DELIVERY_UPDATE",
      title: "Out for Delivery",
      message: `Your order #${order.orderNumber} is out for delivery.${otpMsg}`,
      link: buyerLink,
      metadata: { orderId: order._id, status: newStatus },
    });
  }

  return {
    success: true,
    message: `Order status successfully transitioned to ${newStatus}`,
    order,
  };
}

/**
 * Confirm order payment upon cryptographic signature verification or authoritative captured webhook
 * Idempotent: safe against multiple deliveries
 */
export async function confirmOrderPayment({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  method,
}: {
  orderId?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  method?: string;
}) {
  await connectToDatabase();
  const query = orderId ? { _id: orderId } : { razorpayOrderId };
  const order = await Order.findOne(query);
  if (!order) {
    throw new OrderEngineError("Order not found for payment confirmation", 404, "ORDER_NOT_FOUND");
  }

  // Idempotency check: if already confirmed and captured, return early safely
  if (
    (order.orderStatus === "CONFIRMED" || order.orderStatus === "PROCESSING" || order.orderStatus === "READY_FOR_PICKUP" || order.orderStatus === "DELIVERED") &&
    (order.paymentStatus === "CAPTURED" || order.paymentStatus === "PAID") &&
    order.inventoryConsumed === true
  ) {
    return {
      success: true,
      message: "Order payment already confirmed",
      order,
      alreadyConfirmed: true,
    };
  }

  // If order was cancelled or failed and reservation already voided
  if (order.orderStatus === "CANCELLED" || order.orderStatus === "PAYMENT_FAILED") {
    throw new OrderEngineError(
      `Cannot confirm payment for order in ${order.orderStatus} status`,
      400,
      "INVALID_ORDER_STATE"
    );
  }

  order.orderStatus = "CONFIRMED";
  order.paymentStatus = "CAPTURED";
  if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
  if (razorpaySignature) order.razorpaySignature = razorpaySignature;
  if (method) {
    const validMethods = ["CARD", "UPI", "NETBANKING", "WALLET", "CASH_ON_DELIVERY", "DIRECT_BANK_TRANSFER", "NET_BANKING", "OTHER"];
    if (validMethods.includes(method.toUpperCase())) {
      order.paymentMethod = method.toUpperCase() as any;
    }
  }
  order.paidAt = new Date();
  order.inventoryConsumed = true;
  order.inventoryReservationExpiresAt = undefined;

  order.statusHistory.push({
    status: "CONFIRMED",
    timestamp: new Date(),
    note: `Payment confirmed via Razorpay (Payment ID: ${razorpayPaymentId || "N/A"})`,
  });

  await order.save();

  // Send notifications now that payment is confirmed
  try {
    const buyerLink = order.buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`;
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Confirmed & Paid!",
      message: `Your payment of ₹${order.total} was verified. Order #${order.orderNumber} is confirmed.`,
      link: buyerLink,
      metadata: { orderId: order._id, orderNumber: order.orderNumber, paymentId: razorpayPaymentId },
    });

    if (order.seller) {
      await sendOrderNotification({
        recipientId: order.seller,
        type: "ORDER_UPDATE",
        title: "New Paid Order Received!",
        message: `Order #${order.orderNumber} for ₹${order.total} has been paid and confirmed.`,
        link: `/farmer/orders`,
        metadata: { orderId: order._id, orderNumber: order.orderNumber },
      });
    }
  } catch (notifErr) {
    console.warn("Failed to send payment confirmation notification:", notifErr);
  }

  return { success: true, message: "Payment confirmed successfully", order };
}

/**
 * Handle payment failure and release temporarily reserved inventory
 */
export async function failOrderPayment({
  orderId,
  razorpayOrderId,
  reason,
}: {
  orderId?: string;
  razorpayOrderId?: string;
  reason: string;
}) {
  await connectToDatabase();
  const query = orderId ? { _id: orderId } : { razorpayOrderId };
  const order = await Order.findOne(query);
  if (!order) {
    throw new OrderEngineError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  // Downgrade protection: Do not fail an order if already confirmed or captured
  if (
    order.orderStatus === "CONFIRMED" ||
    order.orderStatus === "PROCESSING" ||
    order.paymentStatus === "CAPTURED" ||
    order.paymentStatus === "PAID"
  ) {
    return {
      success: false,
      message: "Cannot fail an already confirmed/captured order",
      order,
    };
  }

  // Release inventory if not already consumed
  if (!order.inventoryConsumed && order.orderStatus === "PENDING_PAYMENT") {
    for (const item of order.items) {
      try {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { availableQuantity: item.quantity },
          $set: { status: "AVAILABLE" },
        });
        const invDoc = await Inventory.findOne({ product: item.product });
        if (invDoc) {
          invDoc.reservedQuantity = Math.max(0, invDoc.reservedQuantity - item.quantity);
          invDoc.availableQuantity = Math.max(0, invDoc.currentQuantity - invDoc.reservedQuantity);
          await invDoc.save();
        }
      } catch (invErr) {
        console.error(`Failed to release inventory for item ${item.product}:`, invErr);
      }
    }
  }

  order.orderStatus = "PAYMENT_FAILED";
  order.paymentStatus = "FAILED";
  order.failureReason = reason;
  order.inventoryReservationExpiresAt = undefined;
  order.statusHistory.push({
    status: "PAYMENT_FAILED",
    timestamp: new Date(),
    note: `Payment failed: ${reason}`,
  });

  await order.save();

  try {
    const buyerLink = order.buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`;
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Payment Failed",
      message: `Payment for order #${order.orderNumber} failed: ${reason}. You can retry checkout.`,
      link: buyerLink,
      metadata: { orderId: order._id, orderNumber: order.orderNumber, reason },
    });
  } catch (notifErr) {
    console.warn("Failed to send payment failure notification:", notifErr);
  }

  return { success: true, message: "Order payment marked failed and inventory released", order };
}

/**
 * Scan and release expired inventory reservations for unpaid orders (> 15 mins)
 */
export async function releaseExpiredInventoryReservations() {
  await connectToDatabase();
  const now = new Date();
  const expiredOrders = await Order.find({
    orderStatus: "PENDING_PAYMENT",
    paymentStatus: { $in: ["CREATED", "FAILED"] },
    inventoryConsumed: { $ne: true },
    inventoryReservationExpiresAt: { $lt: now },
  });

  let releasedCount = 0;
  for (const order of expiredOrders) {
    try {
      await failOrderPayment({
        orderId: order._id.toString(),
        reason: "Inventory reservation expired before payment completion (15-minute timeout)",
      });
      releasedCount++;
    } catch (err) {
      console.error(`Error releasing expired reservation for order ${order._id}:`, err);
    }
  }

  return { releasedCount };
}

/**
 * Stage 1: Record Refund Requested (Flow: CAPTURED -> REFUND_REQUESTED)
 */
export async function recordRefundRequest({
  orderId,
  refundId,
  refundAmount,
  reason,
}: {
  orderId: string;
  refundId: string;
  refundAmount: number;
  reason?: string;
}) {
  await connectToDatabase();
  const order = await Order.findById(orderId);
  if (!order) {
    throw new OrderEngineError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  // Flow: CAPTURED -> REFUND_REQUESTED
  order.paymentStatus = "REFUND_REQUESTED";
  order.refundId = refundId;
  order.refundAmount = refundAmount;
  order.refundStatus = "REQUESTED";
  order.refundRequestedAt = new Date();

  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    note: `Refund requested for ₹${refundAmount}. Reason: ${reason || "User cancellation"}. Refund ID: ${refundId}`,
  });

  await order.save();
  return order;
}

/**
 * Stage 2: Confirm Refund Completed via Razorpay Webhook or Status Verification
 */
export async function confirmRefundCompleted({
  refundId,
  orderId,
  amount,
}: {
  refundId: string;
  orderId?: string;
  amount?: number;
}) {
  await connectToDatabase();
  const query = orderId ? { _id: orderId } : { refundId };
  const order = await Order.findOne(query);
  if (!order) {
    throw new OrderEngineError("Order not found for refund confirmation", 404, "ORDER_NOT_FOUND");
  }

  const refundAmt = amount || order.refundAmount || order.total;
  const isFullRefund = refundAmt >= order.total;

  order.paymentStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";
  order.refundStatus = "PROCESSED";
  order.refundCompletedAt = new Date();

  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    note: `Refund of ₹${refundAmt} confirmed by Razorpay. Refund ID: ${refundId}`,
  });

  await order.save();

  try {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Refund Processed",
      message: `Refund of ₹${refundAmt} for order #${order.orderNumber} has been successfully processed to your payment method.`,
      link: order.buyerType === "BULK_BUYER" ? `/buyer/orders/${order._id}` : `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, refundId },
    });
  } catch (e) {
    console.warn("Failed to notify buyer about refund:", e);
  }

  return order;
}

