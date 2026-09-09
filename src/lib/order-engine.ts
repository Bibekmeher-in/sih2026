import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Order, OrderStatusType } from "@/models/Order";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";
import { Notification, NotificationType } from "@/models/Notification";
import { User } from "@/models/User";

/**
 * Finite State Machine for Order Status Transitions
 */
export const VALID_ORDER_STATUSES: OrderStatusType[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "ASSIGNED_FOR_DELIVERY",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

export const VALID_STATUS_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "ASSIGNED_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["IN_TRANSIT", "ASSIGNED_FOR_DELIVERY", "CANCELLED"],
  ASSIGNED_FOR_DELIVERY: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export interface OrderCreationItemInput {
  productId: string;
  quantity: number;
}

export interface OrderDeliveryAddressInput {
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
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
  paymentMethod?: "UPI" | "DIRECT_BANK_TRANSFER" | "CASH_ON_DELIVERY" | "NET_BANKING";
  notes?: string;
  autoConfirm?: boolean; // For simulated instant checkout
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
 * 12-Step Robust Order Creation Pipeline with Inventory Reservation
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
  } = params;

  // 1. Authenticate user
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new OrderEngineError("Authentication required to place an order", 401, "UNAUTHORIZED");
  }

  const buyerUser = await User.findById(userId);
  if (!buyerUser) {
    throw new OrderEngineError("Authenticated user record not found", 401, "USER_NOT_FOUND");
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
    sellerId: mongoose.Types.ObjectId;
    sellerType: "User" | "FarmerProfile" | "FPO";
  }> = [];

  let primarySellerId: mongoose.Types.ObjectId | null = null;
  let primarySellerType: "User" | "FarmerProfile" | "FPO" = "User";

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
    }

    verifiedItems.push({
      product: product._id as mongoose.Types.ObjectId,
      productName: product.name,
      quantity: item.quantity,
      unit: product.unit,
      unitPrice,
      totalItemPrice,
      sellerId: (product.seller as mongoose.Types.ObjectId) || primarySellerId,
      sellerType: product.sellerType || "User",
    });
  }

  // 7. Calculate subtotal server-side
  const subtotal = verifiedItems.reduce((acc, curr) => acc + curr.totalItemPrice, 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // 8. Calculate delivery fee server-side
  let deliveryFee = 0;
  if (buyerType === "CONSUMER") {
    deliveryFee = roundedSubtotal >= 500 ? 0 : 40;
  } else {
    // Bulk freight logic: Free freight above ₹25,000, else flat ₹500 dispatch
    deliveryFee = roundedSubtotal >= 25000 ? 0 : 500;
  }

  // 9. Calculate total server-side
  const grandTotal = Math.round((roundedSubtotal + deliveryFee) * 100) / 100;

  // 10. Reserve inventory atomically (Prevent overselling)
  const successfullyReserved: Array<{ productId: mongoose.Types.ObjectId; quantity: number }> = [];

  try {
    for (const item of verifiedItems) {
      // Atomic inventory deduction & reservation
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

      // Update product status if sold out
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
        // Create initial inventory tracking if not present
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
    // Compensating transaction (Rollback any items reserved before the failure)
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

  // 11. Create order
  const orderPrefix = buyerType === "BULK_BUYER" ? "KD-BLK" : "KD-CON";
  const orderNumber = `${orderPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const initialStatus: OrderStatusType = autoConfirm ? "CONFIRMED" : "PENDING";
  const initialPayment = autoConfirm ? "PAID" : "PENDING";

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
    })),
    subtotal: roundedSubtotal,
    deliveryFee,
    total: grandTotal,
    deliveryAddress: {
      recipientName: deliveryAddress.recipientName || buyerUser.name,
      recipientPhone: deliveryAddress.recipientPhone || buyerUser.phone,
      addressLine: deliveryAddress.addressLine,
      district: deliveryAddress.district,
      state: deliveryAddress.state,
      pincode: deliveryAddress.pincode,
      coordinates: deliveryAddress.coordinates,
    },
    orderStatus: initialStatus,
    paymentStatus: initialPayment,
    paymentMethod,
    notes,
  });

  // Notifications
  // Notify Buyer
  await sendOrderNotification({
    recipientId: buyerUser._id,
    type: "ORDER_UPDATE",
    title: autoConfirm ? "Order Confirmed!" : "New Order Created",
    message: `Order #${order.orderNumber} for ₹${grandTotal} has been ${autoConfirm ? "confirmed" : "placed"}. Inventory is reserved.`,
    link: `/consumer/orders/${order._id}`,
    metadata: { orderId: order._id, orderNumber: order.orderNumber },
  });

  // Notify Seller
  if (primarySellerId) {
    await sendOrderNotification({
      recipientId: primarySellerId,
      type: "ORDER_UPDATE",
      title: "New Order Received!",
      message: `You have received a new order #${order.orderNumber} for ₹${grandTotal} from ${deliveryAddress.recipientName}.`,
      link: `/farmer/orders`,
      metadata: { orderId: order._id, orderNumber: order.orderNumber },
    });
  }

  // 12. Return order result
  return {
    success: true,
    order: {
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      itemsCount: verifiedItems.length,
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

  // 1. INVENTORY STATE MANAGEMENT ON STATUS CHANGE
  if (newStatus === "CANCELLED") {
    // Release inventory reservation back to available
    for (const item of order.items) {
      if (item.product) {
        // Product availableQuantity restored
        await Product.findByIdAndUpdate(item.product, {
          $inc: { availableQuantity: item.quantity },
          $set: { status: "AVAILABLE" },
        });

        // Inventory collection: reservedQuantity reduced, availableQuantity restored
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
    if (actor?.reason) {
      order.notes = order.notes ? `${order.notes} | Cancelled: ${actor.reason}` : `Cancelled: ${actor.reason}`;
    }

    await order.save();

    // Notify Buyer
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Cancelled",
      message: `Your order #${order.orderNumber} has been cancelled. Any held reservation or payment has been reversed.`,
      link: `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: "CANCELLED" },
    });

    // Notify Seller
    if (order.seller) {
      await sendOrderNotification({
        recipientId: order.seller,
        type: "ORDER_UPDATE",
        title: "Order Cancelled",
        message: `Order #${order.orderNumber} was cancelled. Reserved produce has been released back into your available stock.`,
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

  if (newStatus === "DELIVERED") {
    // Consume reservation: physical stock permanently leaves inventory
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
    await order.save();

    // Dispatch Delivery Notifications
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "DELIVERY_UPDATE",
      title: "Order Delivered!",
      message: `Order #${order.orderNumber} has arrived at your delivery address! Enjoy your fresh produce.`,
      link: `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: "DELIVERED" },
    });

    if (order.seller) {
      await sendOrderNotification({
        recipientId: order.seller,
        type: "ORDER_UPDATE",
        title: "Order Completed & Funds Released",
        message: `Order #${order.orderNumber} was marked as delivered. Payment of ₹${order.total} has been released from escrow to your account.`,
        link: `/farmer/earnings`,
        metadata: { orderId: order._id, status: "DELIVERED" },
      });
    }

    return {
      success: true,
      message: "Order marked DELIVERED, reservation consumed, and payout released",
      order,
    };
  }

  // Intermediate statuses
  order.orderStatus = newStatus;
  if (newStatus === "CONFIRMED") {
    order.paymentStatus = "PAID";
  }
  await order.save();

  // Notifications for intermediate states
  if (newStatus === "CONFIRMED") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Confirmed",
      message: `Your order #${order.orderNumber} has been confirmed by the seller and is scheduled for packing.`,
      link: `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "PROCESSING") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order in Processing",
      message: `Order #${order.orderNumber} is currently undergoing farm-gate grading, sorting, and packaging.`,
      link: `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "READY_FOR_PICKUP") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "ORDER_UPDATE",
      title: "Order Ready for Pickup",
      message: `Order #${order.orderNumber} is packaged and waiting at the dispatch bay for logistics collection.`,
      link: `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: newStatus },
    });
  } else if (newStatus === "IN_TRANSIT" || newStatus === "ASSIGNED_FOR_DELIVERY") {
    await sendOrderNotification({
      recipientId: order.buyer,
      type: "DELIVERY_UPDATE",
      title: "Delivery Started",
      message: `Order #${order.orderNumber} is now in transit with our temperature-controlled fleet.`,
      link: `/consumer/orders/${order._id}`,
      metadata: { orderId: order._id, status: newStatus },
    });
  }

  return {
    success: true,
    message: `Order status successfully transitioned to ${newStatus}`,
    order,
  };
}
