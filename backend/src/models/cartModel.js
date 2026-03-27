import { Schema, model } from "mongoose";

const cartItemSchema = new Schema(
  {
    product:  { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    // Price snapshot at time of adding — prevents cart total from fluctuating when product price changes
    price:    { type: Number, required: true, min: 0 },
    // TVA rate snapshot (%) — locked at time of adding so TTC is consistent
    tva:      { type: Number, default: 0, min: 0, max: 100 },
    // Selected variant options (e.g., { color: "Blue", size: "M" })
    // Enables "Blue M" and "Red L" as separate line items in the same cart
    selectedOptions: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user:  { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

// Compound index for looking up cart items by product ID across carts
cartSchema.index({ "items.product": 1 });

// TTL index: auto-delete abandoned carts after 30 days of inactivity
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual: total TTC price summed from items (price = HT, tva = %)
cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce((sum, item) => {
    const ttc = item.price * (1 + (item.tva || 0) / 100);
    return sum + ttc * item.quantity;
  }, 0);
});

cartSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Cart = model("Cart", cartSchema);
export default Cart;
