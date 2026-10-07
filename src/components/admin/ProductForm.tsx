import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addProduct,
  selectAllBrands,
  selectAllCategories,
  updateProduct,
} from '../../store/slices/productSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { api, ApiError } from '../../services/api';
import { Product, ProductVariant } from '../../types';
import { Save, Trash2, Plus, Loader2 } from 'lucide-react';
import { ImageUploadField, GalleryUploadField } from './ImageUploadField';

export interface ProductFormResult {
  product: Product;
  created: boolean;
}

interface ProductFormProps {
  /** Provide a product to edit; omit to create a new one. */
  product?: Product | null;
  onSuccess?: (result: ProductFormResult) => void;
  onCancel?: () => void;
  submitLabel?: string;
  /** Compact single-column friendly layout for use inside a dialog. */
  layout?: 'page' | 'dialog';
}

const DEFAULT_IMAGE = '/src/assets/images/sneakers_white_air_1790933024489.jpg';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

const generateSku = (): string => `MKT-${Math.floor(1000 + Math.random() * 9000)}`;

const fieldClass =
  'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60';

const labelClass = 'block text-xs font-semibold text-slate-700 mb-1.5';

/**
 * Reusable product creation / editing form.
 *
 * Renders the project's existing product schema (title, SKU, pricing, stock,
 * category, brand, media, variants, specifications, merchandising flags) and
 * persists through the real /api/v1/admin/products endpoints. Shared by the
 * "Add Product" dialog, the create route and the edit route so there is exactly
 * one product model in the application.
 */
export const ProductForm: React.FC<ProductFormProps> = ({
  product = null,
  onSuccess,
  onCancel,
  submitLabel,
  layout = 'page',
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectAllCategories);
  const brands = useAppSelector(selectAllBrands);

  const isEditing = !!product;

  const buildInitialForm = (): Partial<Product> => {
    if (product) return { ...product };

    return {
      name: '',
      category: categories[0]?.name || 'Fashion',
      subcategory: '',
      brand: brands[0]?.name || 'Nike',
      price: 99.99,
      compareAtPrice: 129.99,
      inventory: 25,
      sku: generateSku(),
      mainImage: '',
      galleryImages: [],
      shortDescription: '',
      description: '',
      materials: 'Premium materials crafted for long-lasting luxury.',
      careInstructions: 'Spot clean with a gentle microfibre cloth.',
      shippingInfo: 'Fast dispatch within 24 hours across Bangladesh.',
      returnPolicy: '30-day inspection period with original packaging.',
      isFeatured: false,
      isBestSeller: false,
      isFlashDeal: false,
      specifications: {
        Origin: 'Authentic Imported',
        Warranty: '1 Year Official Warranty',
      },
    };
  };

  const [form, setForm] = useState<Partial<Product>>(buildInitialForm);
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants?.length ? product.variants : []
  );
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(buildInitialForm());
    setVariants(product?.variants?.length ? product.variants : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const galleryImages = useMemo(() => {
    const list = form.galleryImages ?? [];
    return list.filter(Boolean);
  }, [form.galleryImages]);

  const setField = <K extends keyof Product>(key: K, value: Product[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAddSpec = () => {
    const key = newSpecKey.trim();
    const value = newSpecVal.trim();
    if (!key || !value) return;
    setField('specifications', { ...(form.specifications || {}), [key]: value });
    setNewSpecKey('');
    setNewSpecVal('');
  };

  const handleRemoveSpec = (key: string) => {
    const next = { ...(form.specifications || {}) };
    delete next[key];
    setField('specifications', next);
  };

  const handleAddVariant = () => {
    const variant: ProductVariant = {
      id: `v_${Date.now()}`,
      sku: `${form.sku || 'MKT'}-V${variants.length + 1}`,
      name: `Option ${variants.length + 1}`,
      attributes: { Edition: 'Standard' },
      price: Number(form.price) || 0,
      inventory: Number(form.inventory) || 0,
    };
    setVariants((prev) => [...prev, variant]);
  };

  const handleRemoveVariant = (variantId: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  // Selecting a main image seeds the gallery with it, mirroring the previous
  // "Use main image" convenience without a manual URL step.
  const handleMainImageChange = (url: string) => {
    setField('mainImage', url);
    if (url) {
      const current = form.galleryImages ?? [];
      if (!current.includes(url)) setField('galleryImages', [url, ...current]);
    }
  };

  const validate = (): string | null => {
    if (!form.name?.trim()) return 'Product title is required.';
    if (!form.sku?.trim()) return 'SKU is required.';
    if (form.price === undefined || Number(form.price) <= 0)
      return 'Selling price must be greater than zero.';
    if (form.compareAtPrice !== undefined && Number(form.compareAtPrice) > 0) {
      if (Number(form.compareAtPrice) < Number(form.price)) {
        return 'Compare-at price cannot be lower than the selling price.';
      }
    }
    if (form.inventory === undefined || Number(form.inventory) < 0)
      return 'Stock quantity cannot be negative.';
    if (!form.category) return 'Select a category.';
    if (!form.brand) return 'Select a brand.';
    if (!form.mainImage?.trim()) return 'A main product image is required - choose an image file.';
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Check the form',
          message: validationError,
          duration: 4000,
        })
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const name = form.name!.trim();
    const price = Number(form.price);
    const compareAtPrice =
      form.compareAtPrice !== undefined && Number(form.compareAtPrice) > 0
        ? Number(form.compareAtPrice)
        : undefined;
    const inventory = Number(form.inventory) || 0;
    const mainImage = form.mainImage!.trim();

    const basePayload: Partial<Product> = {
      name,
      slug: form.slug?.trim() || slugify(name),
      sku: form.sku!.trim().toUpperCase(),
      shortDescription:
        form.shortDescription?.trim() || 'Refined craftsmanship for discerning clients.',
      description: form.description?.trim() || 'Precision engineered with premium materials.',
      category: form.category!,
      subcategory: form.subcategory?.trim() || undefined,
      brand: form.brand!,
      price,
      compareAtPrice,
      discountPercent:
        compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : undefined,
      mainImage,
      galleryImages: galleryImages.length ? galleryImages : [mainImage],
      variants:
        variants.length > 0
          ? variants
          : [
              {
                id: `v_${Date.now()}`,
                sku: `${form.sku!.trim().toUpperCase()}-STD`,
                name: 'Standard Edition',
                attributes: { Edition: 'Standard' },
                price,
                inventory,
              },
            ],
      inventory,
      tags: form.tags?.length ? form.tags : [form.category!, 'Luxury'],
      isFeatured: !!form.isFeatured,
      isBestSeller: !!form.isBestSeller,
      isFlashDeal: !!form.isFlashDeal,
      specifications: form.specifications || {},
      materials: form.materials?.trim() || undefined,
      careInstructions: form.careInstructions?.trim() || undefined,
      shippingInfo: form.shippingInfo?.trim() || undefined,
      returnPolicy: form.returnPolicy?.trim() || undefined,
    };

    try {
      if (product) {
        const payload: Product = {
          ...product,
          ...(basePayload as Product),
          rating: product.rating ?? 5,
          reviewCount: product.reviewCount ?? 0,
          createdAt: product.createdAt,
        };
        // Persist first so the local store can never diverge from the database.
        await api.updateProduct(product.id, payload);
        dispatch(updateProduct(payload));
        dispatch(
          addNotification({
            type: 'success',
            title: 'Product Updated',
            message: `${name} was saved to the catalog.`,
            duration: 3500,
          })
        );
        onSuccess?.({ product: payload, created: false });
      } else {
        const payload = {
          ...basePayload,
          rating: 5,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
        } as Product;
        const saved = await api.createProduct(payload);
        // Adopt the identifier assigned by the database so later edit/delete
        // calls address the persisted record instead of a client-side guess.
        const created: Product = saved?.id ? { ...payload, id: String(saved.id) } : payload;
        dispatch(addProduct(created));
        dispatch(
          addNotification({
            type: 'success',
            title: 'Product Published',
            message: `${name} is now live in the storefront catalog.`,
            duration: 3500,
          })
        );
        onSuccess?.({ product: created, created: true });
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'The product could not be saved. Please check your connection and try again.';
      setError(message);
      dispatch(
        addNotification({
          type: 'error',
          title: isEditing ? 'Update Failed' : 'Publish Failed',
          message,
          duration: 5000,
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const compact = layout === 'dialog';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
        >
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-5 ${compact ? '' : 'lg:grid-cols-12 lg:gap-6'}`}>
        {/* Core fields */}
        <div className={compact ? 'space-y-5' : 'lg:col-span-8 space-y-6'}>
          <section className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
              General Information
            </h3>

            <div>
              <label htmlFor="pf-name" className={labelClass}>
                Product title <span className="text-rose-500">*</span>
              </label>
              <input
                id="pf-name"
                type="text"
                required
                maxLength={160}
                placeholder="e.g. Precision Automatic Titanium Watch"
                value={form.name || ''}
                onChange={(e) => setField('name', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-category" className={labelClass}>
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="pf-category"
                  value={form.category || ''}
                  onChange={(e) => setField('category', e.target.value)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pf-brand" className={labelClass}>
                  Brand <span className="text-rose-500">*</span>
                </label>
                <select
                  id="pf-brand"
                  value={form.brand || ''}
                  onChange={(e) => setField('brand', e.target.value)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="pf-sku" className={labelClass}>
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                id="pf-sku"
                type="text"
                required
                value={form.sku || ''}
                onChange={(e) => setField('sku', e.target.value.toUpperCase())}
                className={`${fieldClass} font-mono`}
              />
            </div>

            <div>
              <label htmlFor="pf-short" className={labelClass}>
                Short description
              </label>
              <textarea
                id="pf-short"
                rows={2}
                maxLength={280}
                placeholder="One or two sentences used on product cards."
                value={form.shortDescription || ''}
                onChange={(e) => setField('shortDescription', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="pf-description" className={labelClass}>
                Full description
              </label>
              <textarea
                id="pf-description"
                rows={compact ? 4 : 5}
                placeholder="Craftsmanship, materials, finishes and what makes this piece distinct."
                value={form.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                className={fieldClass}
              />
            </div>
          </section>

          <section className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
              Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="pf-price" className={labelClass}>
                  Selling price ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pf-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price ?? ''}
                  onChange={(e) => setField('price', Number(e.target.value))}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="pf-compare" className={labelClass}>
                  Compare-at ($)
                </label>
                <input
                  id="pf-compare"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={form.compareAtPrice ?? ''}
                  onChange={(e) =>
                    setField(
                      'compareAtPrice',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="pf-stock" className={labelClass}>
                  Stock units <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pf-stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.inventory ?? ''}
                  onChange={(e) => setField('inventory', Number(e.target.value))}
                  className={fieldClass}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Leave compare-at empty when the item is not discounted.
            </p>
          </section>

          <section className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
                Variants
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add variant
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No variants yet. A “Standard Edition” variant is created automatically on save.
              </p>
            ) : (
              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-xl border border-slate-200 bg-white p-2.5"
                  >
                    <label className="sm:col-span-4 min-w-0">
                      <span className="sr-only">Variant {index + 1} name</span>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((v) =>
                              v.id === variant.id ? { ...v, name: e.target.value } : v
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </label>
                    <label className="sm:col-span-3 min-w-0">
                      <span className="sr-only">Variant {index + 1} SKU</span>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((v) => (v.id === variant.id ? { ...v, sku: e.target.value } : v))
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </label>
                    <label className="sm:col-span-2 min-w-0">
                      <span className="sr-only">Variant {index + 1} price</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((v) =>
                              v.id === variant.id ? { ...v, price: Number(e.target.value) } : v
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </label>
                    <label className="sm:col-span-2 min-w-0">
                      <span className="sr-only">Variant {index + 1} stock</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.inventory}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((v) =>
                              v.id === variant.id
                                ? { ...v, inventory: Number(e.target.value) }
                                : v
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </label>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        aria-label={`Remove variant ${variant.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
              Technical Specifications
            </h3>

            {Object.keys(form.specifications || {}).length > 0 && (
              <div className="space-y-2">
                {Object.entries(form.specifications || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <span className="font-semibold text-slate-700 truncate">{key}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-600 text-right">{value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(key)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        aria-label={`Remove specification ${key}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <label>
                <span className="sr-only">Specification name</span>
                <input
                  type="text"
                  placeholder="Spec (e.g. Battery Life)"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label>
                <span className="sr-only">Specification value</span>
                <input
                  type="text"
                  placeholder="Value (e.g. Up to 72 hours)"
                  value={newSpecVal}
                  onChange={(e) => setNewSpecVal(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <button
                type="button"
                onClick={handleAddSpec}
                disabled={!newSpecKey.trim() || !newSpecVal.trim()}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </section>
        </div>

        {/* Media & merchandising */}
        <div className={compact ? 'space-y-5' : 'lg:col-span-4 space-y-6'}>
          <section className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
              Product Media
            </h3>

            <div className="aspect-square w-full max-w-[240px] mx-auto rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-3">
              {form.mainImage ? (
                <img
                  src={form.mainImage}
                  alt={`Preview of ${form.name || 'product'}`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                <span className="text-[11px] text-slate-400 text-center px-4">
                  No image selected yet
                </span>
              )}
            </div>

            <ImageUploadField
              label="Main image"
              required
              value={form.mainImage || ''}
              onChange={handleMainImageChange}
            />

            <GalleryUploadField
              value={galleryImages}
              onChange={(urls) => setField('galleryImages', urls)}
            />
          </section>

          <section className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
              Merchandising
            </h3>

            {(
              [
                ['isFeatured', 'Feature on storefront homepage'],
                ['isBestSeller', 'Mark as best seller'],
                ['isFlashDeal', 'Include in flash deals countdown'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer transition-colors hover:border-slate-300"
              >
                <input
                  type="checkbox"
                  checked={!!form[key]}
                  onChange={(e) => setField(key, e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded shrink-0"
                />
                <span className="text-xs font-semibold text-slate-700">{label}</span>
              </label>
            ))}
          </section>

          <section className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
              Logistics & Care
            </h3>

            <div>
              <label htmlFor="pf-materials" className={labelClass}>
                Materials
              </label>
              <textarea
                id="pf-materials"
                rows={2}
                value={form.materials || ''}
                onChange={(e) => setField('materials', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="pf-care" className={labelClass}>
                Care instructions
              </label>
              <textarea
                id="pf-care"
                rows={2}
                value={form.careInstructions || ''}
                onChange={(e) => setField('careInstructions', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="pf-shipping" className={labelClass}>
                Shipping information
              </label>
              <textarea
                id="pf-shipping"
                rows={2}
                value={form.shippingInfo || ''}
                onChange={(e) => setField('shippingInfo', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="pf-return" className={labelClass}>
                Return policy
              </label>
              <textarea
                id="pf-return"
                rows={2}
                value={form.returnPolicy || ''}
                onChange={(e) => setField('returnPolicy', e.target.value)}
                className={fieldClass}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-5 sm:static sm:mx-0 px-5 sm:px-0 py-3 sm:py-0 bg-white/95 sm:bg-transparent backdrop-blur-sm border-t sm:border-0 border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 z-10">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{isEditing ? 'Saving…' : 'Publishing…'}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{submitLabel || (isEditing ? 'Save Changes' : 'Publish Product')}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};