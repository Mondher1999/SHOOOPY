import { Schema, model } from "mongoose";

const redirectSchema = new Schema(
  {
    from: { type: String, required: true, unique: true, trim: true },
    to: { type: String, required: true, trim: true },
    type: { type: Number, default: 301, enum: [301, 302] },
    isActive: { type: Boolean, default: true },
    source: {
      type: String,
      default: "manual",
      enum: ["manual", "slug-change"],
    },
  },
  { timestamps: true }
);

// Index for fast lookup by source path
redirectSchema.index({ from: 1, isActive: 1 });

redirectSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Redirect = model("Redirect", redirectSchema);
export default Redirect;
