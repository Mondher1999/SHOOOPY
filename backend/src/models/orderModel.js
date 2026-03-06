import { Schema, model } from "mongoose";

// Embedded snapshot of a cart item at the time of ordering —
// preserves name/price even if the product is later edited or deleted.
const orderItemSchema = new Schema(
  {
    product:  { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name:     { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price:    { type: Number, required: true, min: 0 },
    // First image URL (thumbnail) captured at order time
    image:    { type: String, default: "" },
  },
  { _id: false }
);

// Embedded snapshot of the shipping address at the time of ordering —
// keeps the address intact even if the user later edits or deletes it.
const shippingAddressSchema = new Schema(
  {
    fullName:   { type: String, required: true },
    phone:      { type: String, required: true },
    street:     { type: String, required: true },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    postalCode: { type: String, required: true },
    country:    { type: String, required: true },
    label:      { type: String, default: "home" },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    date:   { type: Date, default: Date.now },
    note:   { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user:            { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber:     { type: String, required: true, unique: true },
    items:           { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod:   { type: String, enum: ["COD"], default: "COD" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    totalPrice:    { type: Number, required: true, min: 0 },
    shippingCost:  { type: Number, default: 0, min: 0 },
    notes:         { type: String, default: "" },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

// User's order history — paginated and sorted by newest
orderSchema.index({ user: 1, createdAt: -1 });

// Admin filtering by status
orderSchema.index({ status: 1 });

// Date-range filtering (admin analytics)
orderSchema.index({ createdAt: -1 });

// Admin search by order number
orderSchema.index({ orderNumber: 1 });

orderSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Order = model("Order", orderSchema);
export default Order;
