"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { getAllCategoriesAPI } from "@/services/category-service";
import { createProductAPI, updateProductAPI } from "@/services/product-service";
import ImageUploader from "@/components/admin/ImageUploader";
import ImageSortable from "@/components/admin/ImageSortable";
import type { Category, Product, ProductImage } from "@/types";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(1, "products:validation.nameRequired"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "products:validation.priceMin"),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  category: z.string().optional(),
  stock: z.coerce.number().int().min(0, "products:validation.stockMin").default(0),
  sku: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  isEdit?: boolean;
}

export default function ProductForm({ product, isEdit = false }: ProductFormProps) {
  const { t } = useTranslation(["products", "common"]);
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Images are managed independently of the Zod schema
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);

  // Attributes as parallel arrays
  const [attrKeys, setAttrKeys] = useState<string[]>(
    product ? Object.keys(product.attributes) : []
  );
  const [attrValues, setAttrValues] = useState<string[]>(
    product ? Object.values(product.attributes) : []
  );

  const defaultValues: ProductFormValues = product
    ? {
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? undefined,
        category: product.category?.id ?? "",
        stock: product.stock,
        sku: product.sku ?? "",
      }
    : {
        name: "",
        description: "",
        price: 0,
        compareAtPrice: undefined,
        category: "",
        stock: 0,
        sku: "",
      };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  useEffect(() => {
    getAllCategoriesAPI()
      .then((res) => setCategories(res.data))
      .catch((err) => logger.error("loadCategories failed:", err))
      .finally(() => setLoadingCategories(false));
  }, []);

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitError(null);
    try {
      const attributes: Record<string, string> = {};
      attrKeys.forEach((key, i) => {
        if (key.trim()) attributes[key.trim()] = attrValues[i]?.trim() ?? "";
      });

      const payload = {
        name: values.name,
        description: values.description || "",
        price: values.price,
        compareAtPrice: values.compareAtPrice ?? null,
        category: values.category || null,
        stock: values.stock,
        sku: values.sku || null,
        images,
        attributes,
      };

      if (isEdit && product) {
        await updateProductAPI(product.id, payload);
        toast({ title: t("products:actions.successUpdated") });
      } else {
        await createProductAPI(payload);
        toast({ title: t("products:actions.successCreated") });
      }
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      setSubmitError(msg);
      logger.error("productForm submit failed:", err);
    }
  };

  const handleUploaded = (newImages: ProductImage[]) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products" aria-label={t("products:form.backToProducts")}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? t("products:form.editTitle") : t("products:form.createTitle")}
          </h1>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive" role="alert">
          <p className="text-sm">{submitError}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("products:form.sectionBasic")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">
                  {t("products:form.nameLabel")} <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={t("products:form.namePlaceholder")}
                  aria-required="true"
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={cn(errors.name && "border-destructive")}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="name-error" className="text-xs text-destructive" role="alert">
                    {t(errors.name.message as string)}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">{t("products:form.descriptionLabel")}</Label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder={t("products:form.descriptionPlaceholder")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("products:form.sectionPricing")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price">
                  {t("products:form.priceLabel")} <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t("products:form.pricePlaceholder")}
                  aria-required="true"
                  aria-describedby={errors.price ? "price-error" : undefined}
                  className={cn(errors.price && "border-destructive")}
                  {...register("price")}
                />
                {errors.price && (
                  <p id="price-error" className="text-xs text-destructive" role="alert">
                    {t(errors.price.message as string)}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="compareAtPrice">{t("products:form.compareAtPriceLabel")}</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t("products:form.compareAtPricePlaceholder")}
                  {...register("compareAtPrice")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("products:form.sectionOrganization")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="category">{t("products:form.categoryLabel")}</Label>
                {loadingCategories ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <select
                    id="category"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register("category")}
                  >
                    <option value="">{t("products:form.categoryPlaceholder")}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="sku">{t("products:form.skuLabel")}</Label>
                <Input
                  id="sku"
                  placeholder={t("products:form.skuPlaceholder")}
                  {...register("sku")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stock">
                  {t("products:form.stockLabel")} <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder={t("products:form.stockPlaceholder")}
                  aria-describedby={errors.stock ? "stock-error" : undefined}
                  className={cn(errors.stock && "border-destructive")}
                  {...register("stock")}
                />
                {errors.stock && (
                  <p id="stock-error" className="text-xs text-destructive" role="alert">
                    {t(errors.stock.message as string)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("products:form.sectionImages")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isEdit && product ? (
                <>
                  <ImageUploader
                    productId={product.id}
                    onUploaded={handleUploaded}
                  />
                  {images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {t("products:upload.sortableHint")}
                      </p>
                      <ImageSortable
                        productId={product.id}
                        images={images}
                        onChange={setImages}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("products:upload.saveFirstHint")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attributes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("products:form.attributesLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attrKeys.map((key, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={t("products:form.attributesKeyPlaceholder")}
                    value={attrKeys[index]}
                    onChange={(e) => {
                      const next = [...attrKeys];
                      next[index] = e.target.value;
                      setAttrKeys(next);
                    }}
                  />
                  <Input
                    placeholder={t("products:form.attributesValuePlaceholder")}
                    value={attrValues[index] ?? ""}
                    onChange={(e) => {
                      const next = [...attrValues];
                      next[index] = e.target.value;
                      setAttrValues(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAttrKeys(attrKeys.filter((_, i) => i !== index));
                      setAttrValues(attrValues.filter((_, i) => i !== index));
                    }}
                    aria-label={t("products:form.removeAttributeAriaLabel")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setAttrKeys([...attrKeys, ""]); setAttrValues([...attrValues, ""]); }}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("products:form.attributesAddButton")}
              </Button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">{t("common:actions.cancel")}</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("products:form.submitting")
                : isEdit
                ? t("products:form.submitEdit")
                : t("products:form.submitCreate")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
