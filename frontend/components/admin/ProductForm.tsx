"use client";

import { useState, useEffect, useMemo } from "react";
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
import { getEnabledProductTypesAPI } from "@/services/settings-service";
import ImageUploader from "@/components/admin/ImageUploader";
import ImageSortable from "@/components/admin/ImageSortable";
import type { TaggableAttribute } from "@/components/admin/ImageSortable";
import type { Category, Product, ProductImage, ProductTypeCatalog } from "@/types";
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

  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [typeCatalog, setTypeCatalog] = useState<ProductTypeCatalog>({});

  const [attrKeys, setAttrKeys] = useState<string[]>(
    product ? Object.keys(product.attributes) : []
  );
  const [attrValues, setAttrValues] = useState<string[]>(
    product ? Object.values(product.attributes).map(String) : []
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
    resolver: zodResolver(productSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    getAllCategoriesAPI()
      .then((res) => setCategories(res.data))
      .catch((err) => logger.error("loadCategories failed:", err))
      .finally(() => setLoadingCategories(false));

    getEnabledProductTypesAPI()
      .then((res) => setTypeCatalog(res.data))
      .catch((err) => logger.error("loadProductTypes failed:", err));
  }, []);

  const taggableAttributes = useMemo<TaggableAttribute[]>(() => {
    if (!product?.productType || !typeCatalog[product.productType]) return [];
    const typeDef = typeCatalog[product.productType];
    return typeDef.attributes
      .filter(
        (attr) =>
          (attr.type === "multi-select" || attr.type === "select") &&
          attr.options &&
          attr.options.length > 0 &&
          product.attributes[attr.key] !== undefined
      )
      .map((attr) => ({
        key: attr.key,
        label: t(`products:typeAttrs.${attr.key}`, { defaultValue: attr.label }),
        options: attr.options!,
      }));
  }, [product, typeCatalog, t]);

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
    <div className="space-y-5">
      {/* Page header — text-xl/600 per design-system typography */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/admin/products" aria-label={t("products:form.backToProducts")}>
            <ArrowLeft className="h-5 w-5 text-polaris-icon" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-polaris-text">
          {isEdit ? t("products:form.editTitle") : t("products:form.createTitle")}
        </h1>
      </div>

      {submitError && (
        <Alert variant="destructive" role="alert">
          <p className="text-sm">{submitError}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit as never)} noValidate>
        {/* Two-column Polaris layout — Main (2/3) + Sidebar (1/3 = 320px) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 items-start">

          {/* ═══ LEFT — Main content ═══ */}
          <div className="flex flex-col gap-3">

            {/* Title & Description */}
            <Card className="shadow-polaris">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-polaris-text">
                  {t("products:form.sectionBasic")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm text-polaris-text">
                    {t("products:form.nameLabel")} <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={t("products:form.namePlaceholder")}
                    aria-required="true"
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={cn("rounded", errors.name && "border-destructive")}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-xs text-destructive" role="alert">
                      {t(errors.name.message as string)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description" className="text-sm text-polaris-text">
                    {t("products:form.descriptionLabel")}
                  </Label>
                  <textarea
                    id="description"
                    rows={5}
                    placeholder={t("products:form.descriptionPlaceholder")}
                    className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-polaris-text-subdued focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    {...register("description")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card className="shadow-polaris">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-polaris-text">
                  {t("products:form.sectionImages")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isEdit && product ? (
                  <div className="space-y-3">
                    <ImageUploader productId={product.id} onUploaded={handleUploaded} />
                    {images.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-polaris-text-subdued">
                          {t("products:upload.sortableHint")}
                        </p>
                        <ImageSortable
                          productId={product.id}
                          images={images}
                          onChange={setImages}
                          taggableAttributes={taggableAttributes}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-polaris-text-subdued py-4 text-center">
                    {t("products:upload.saveFirstHint")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="shadow-polaris">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-polaris-text">
                  {t("products:form.sectionPricing")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="price" className="text-sm text-polaris-text">
                      {t("products:form.priceLabel")} <span className="text-destructive" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("products:form.pricePlaceholder")}
                      aria-required="true"
                      aria-describedby={errors.price ? "price-error" : undefined}
                      className={cn("rounded", errors.price && "border-destructive")}
                      {...register("price")}
                    />
                    {errors.price && (
                      <p id="price-error" className="text-xs text-destructive" role="alert">
                        {t(errors.price.message as string)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="compareAtPrice" className="text-sm text-polaris-text">
                      {t("products:form.compareAtPriceLabel")}
                    </Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("products:form.compareAtPricePlaceholder")}
                      className="rounded"
                      {...register("compareAtPrice")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attributes */}
            <Card className="shadow-polaris">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-polaris-text">
                  {t("products:form.attributesLabel")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {attrKeys.map((_key, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={t("products:form.attributesKeyPlaceholder")}
                      value={attrKeys[index]}
                      className="rounded"
                      onChange={(e) => {
                        const next = [...attrKeys];
                        next[index] = e.target.value;
                        setAttrKeys(next);
                      }}
                    />
                    <Input
                      placeholder={t("products:form.attributesValuePlaceholder")}
                      value={attrValues[index] ?? ""}
                      className="rounded"
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
                      className="shrink-0"
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
                  className="rounded text-sm font-medium"
                  onClick={() => { setAttrKeys([...attrKeys, ""]); setAttrValues([...attrValues, ""]); }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("products:form.attributesAddButton")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ═══ RIGHT — Sidebar ═══ */}
          <div className="flex flex-col gap-3">

            {/* Product type (read-only if set) */}
            {product?.productType && (
              <Card className="shadow-polaris">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold text-polaris-text">
                    {t("products:form.productTypeLabel", { defaultValue: "Product type" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-polaris-text-subdued capitalize">
                    {t(`products:typeNames.${product.productType}`, { defaultValue: product.productType.replace(/_/g, " ") })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Organization — Category */}
            <Card className="shadow-polaris">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-polaris-text">
                  {t("products:form.sectionOrganization")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-sm text-polaris-text">
                    {t("products:form.categoryLabel")}
                  </Label>
                  {loadingCategories ? (
                    <Skeleton className="h-9 w-full rounded" />
                  ) : (
                    <select
                      id="category"
                      className="flex h-9 w-full rounded border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              </CardContent>
            </Card>

            {/* Inventory — SKU + Stock */}
            <Card className="shadow-polaris">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-polaris-text">
                  {t("products:form.sectionInventory", { defaultValue: "Inventory" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="sku" className="text-sm text-polaris-text">
                    {t("products:form.skuLabel")}
                  </Label>
                  <Input
                    id="sku"
                    placeholder={t("products:form.skuPlaceholder")}
                    className="rounded"
                    {...register("sku")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stock" className="text-sm text-polaris-text">
                    {t("products:form.stockLabel")} <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={t("products:form.stockPlaceholder")}
                    aria-describedby={errors.stock ? "stock-error" : undefined}
                    className={cn("rounded", errors.stock && "border-destructive")}
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
          </div>
        </div>

        {/* Submit — full width below columns, per design-system form page spec */}
        <div className="flex gap-2 justify-end mt-5">
          <Button type="button" variant="outline" className="rounded text-sm font-medium" asChild>
            <Link href="/admin/products">{t("common:actions.cancel")}</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="rounded text-sm font-medium">
            {isSubmitting
              ? t("products:form.submitting")
              : isEdit
              ? t("products:form.submitEdit")
              : t("products:form.submitCreate")}
          </Button>
        </div>
      </form>
    </div>
  );
}
