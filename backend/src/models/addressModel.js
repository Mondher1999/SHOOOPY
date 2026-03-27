import { Schema, model } from "mongoose";

const addressSchema = new Schema(
  {
    user:       { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName:   { type: String, required: true, trim: true },
    phone:      { type: String, required: true, trim: true },
    street:     { type: String, required: true, trim: true },
    city:       { type: String, trim: true },
    state:      { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country:    { type: String, trim: true, default: "US" },
    isDefault:  { type: Boolean, default: false },
    label:      { type: String, enum: ["home", "work", "other"], default: "home" },
  },
  { timestamps: true }
);

// Primary lookup: user's addresses
addressSchema.index({ user: 1 });

// Finding the default address quickly
addressSchema.index({ user: 1, isDefault: 1 });

addressSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Address = model("Address", addressSchema);
export default Address;
