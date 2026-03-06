import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    images: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: null, trim: true },
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    attributes: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Full-text search on name + description
productSchema.index({ name: "text", description: "text" });

// Compound index for category-filtered, active-only product listings sorted by price
productSchema.index({ category: 1, isActive: 1, price: 1 });

// Compound index for vendor's own product listing
productSchema.index({ vendor: 1, isActive: 1 });

// Default listing: active products by newest
productSchema.index({ isActive: 1, createdAt: -1 });

// Sparse unique index for SKU (null allowed, but non-null must be unique)
productSchema.index({ sku: 1 }, { unique: true, sparse: true });

// Auto-generate slug from name before saving
productSchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();
  const base = this.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let slug = base;
  let counter = 1;
  while (await model("Product").exists({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${counter++}`;
  }
  this.slug = slug;
  next();
});

productSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Product = model("Product", productSchema);
export default Product;
