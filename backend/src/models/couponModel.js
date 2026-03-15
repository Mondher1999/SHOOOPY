import { Schema, model } from "mongoose";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 }, // cap for percentage, 0 = no cap
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });

couponSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Coupon = model("Coupon", couponSchema);
export default Coupon;
