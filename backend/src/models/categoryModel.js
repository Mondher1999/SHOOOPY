import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, default: "" },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for tree queries (children of a parent)
categorySchema.index({ parent: 1 });

// Auto-generate slug from name before saving
categorySchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();
  const base = this.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  // Ensure uniqueness by appending a suffix if slug already exists
  let slug = base;
  let counter = 1;
  while (await model("Category").exists({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${counter++}`;
  }
  this.slug = slug;
  next();
});

categorySchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Category = model("Category", categorySchema);
export default Category;
