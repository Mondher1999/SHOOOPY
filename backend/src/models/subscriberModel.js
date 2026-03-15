import { Schema, model } from "mongoose";

const subscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    subscribedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    source: {
      type: String,
      enum: ["homepage", "checkout", "footer"],
      default: "homepage",
    },
  },
  { timestamps: true }
);

subscriberSchema.index({ email: 1 }, { unique: true });

subscriberSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Subscriber = model("Subscriber", subscriberSchema);
export default Subscriber;
