import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    user:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    order:   { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    title:   { type: String, required: true, trim: true, maxlength: 100 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Product reviews listing — sorted by newest
reviewSchema.index({ product: 1, createdAt: -1 });

// Rating aggregation helper — group by product
reviewSchema.index({ product: 1, rating: 1 });

reviewSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Review = model("Review", reviewSchema);
export default Review;
