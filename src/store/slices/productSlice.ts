import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, Category, Brand, PromotionBanner, ProductReview, AuditLog, MediaAsset } from '../../types';
import {
  initialProducts,
  initialCategories,
  initialBrands,
  initialBanners,
  initialReviews,
  initialAuditLogs,
  initialMediaAssets,
} from '../../services/mockData';

interface ProductState {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  banners: PromotionBanner[];
  reviews: Record<string, ProductReview[]>;
  auditLogs: AuditLog[];
  mediaAssets: MediaAsset[];
  selectedCategory: string | null;
  selectedBrand: string | null;
  priceRange: [number, number];
  sortBy: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
  /**
   * True once `CatalogBootstrap` has replaced the bundled seed records with the
   * live catalog. Consumers that must not act on placeholder data (for example
   * pruning stale wishlist ids) wait for this instead of guessing from array
   * length, which is non-empty from the very first render.
   */
  catalogLoaded: boolean;
}

const initialState: ProductState = {
  products: initialProducts,
  categories: initialCategories,
  brands: initialBrands,
  banners: initialBanners,
  reviews: initialReviews,
  auditLogs: initialAuditLogs,
  mediaAssets: initialMediaAssets,
  selectedCategory: null,
  selectedBrand: null,
  priceRange: [0, 2000],
  sortBy: 'featured',
  catalogLoaded: false,
};

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    /**
     * Replaces the bundled seed catalog with what the API returned at boot.
     * Without this the storefront would render hard-coded records and ignore
     * everything the admin console writes to the database.
     */
    hydrateCatalog: (
      state,
      action: PayloadAction<{
        products?: Product[];
        categories?: Category[];
        brands?: Brand[];
        banners?: PromotionBanner[];
        mediaAssets?: MediaAsset[];
      }>
    ) => {
      const { products, categories, brands, banners, mediaAssets } = action.payload;
      if (products?.length) state.products = products;
      if (categories?.length) state.categories = categories;
      if (brands?.length) state.brands = brands;
      if (banners?.length) state.banners = banners;
      if (mediaAssets?.length) state.mediaAssets = mediaAssets;

      // Keep the price filter wide enough for whatever the catalog now holds.
      const max = state.products.reduce((acc, p) => Math.max(acc, Number(p.price) || 0), 0);
      state.priceRange = [0, Math.ceil(max / 100) * 100 || 2000];
      state.catalogLoaded = true;
    },

    /** Replaces locally generated audit entries with the persisted audit trail. */
    hydrateAuditLogs: (state, action: PayloadAction<AuditLog[]>) => {
      if (action.payload.length) state.auditLogs = action.payload;
    },

    // Product CRUD
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
      state.auditLogs.unshift({
        id: 'log_' + Date.now(),
        actor: 'Admin',
        action: 'Product Created',
        resource: action.payload.name,
        details: `SKU: ${action.payload.sku}, Price: $${action.payload.price}`,
        timestamp: new Date().toISOString(),
      });
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const idx = state.products.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) {
        state.products[idx] = action.payload;
        state.auditLogs.unshift({
          id: 'log_' + Date.now(),
          actor: 'Admin',
          action: 'Product Updated',
          resource: action.payload.name,
          details: `Updated stock and pricing for ${action.payload.sku}`,
          timestamp: new Date().toISOString(),
        });
      }
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      const p = state.products.find((prod) => prod.id === action.payload);
      state.products = state.products.filter((prod) => prod.id !== action.payload);
      if (p) {
        state.auditLogs.unshift({
          id: 'log_' + Date.now(),
          actor: 'Admin',
          action: 'Product Archived/Deleted',
          resource: p.name,
          details: `Removed product id ${action.payload}`,
          timestamp: new Date().toISOString(),
        });
      }
    },

    // Category CRUD
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.push(action.payload);
      state.auditLogs.unshift({
        id: 'log_' + Date.now(),
        actor: 'Admin',
        action: 'Category Added',
        resource: action.payload.name,
        details: `Created new category /${action.payload.slug}`,
        timestamp: new Date().toISOString(),
      });
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const idx = state.categories.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.categories[idx] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    },

    // Banner CRUD
    updateBanner: (state, action: PayloadAction<PromotionBanner>) => {
      const idx = state.banners.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.banners[idx] = action.payload;
        state.auditLogs.unshift({
          id: 'log_' + Date.now(),
          actor: 'Admin',
          action: 'Banner Updated',
          resource: action.payload.title,
          details: `Modified banner placement ${action.payload.position}`,
          timestamp: new Date().toISOString(),
        });
      }
    },

    // Review Actions
    addReview: (state, action: PayloadAction<ProductReview>) => {
      const { productId } = action.payload;
      if (!state.reviews[productId]) {
        state.reviews[productId] = [];
      }
      state.reviews[productId].unshift(action.payload);

      // Recalculate product rating
      const product = state.products.find((p) => p.id === productId);
      if (product) {
        const productReviews = state.reviews[productId];
        const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
        product.reviewCount = productReviews.length;
        product.rating = Number((total / productReviews.length).toFixed(1));
      }
    },

    // Media Library Actions
    addMediaAsset: (state, action: PayloadAction<MediaAsset>) => {
      state.mediaAssets.unshift(action.payload);
      state.auditLogs.unshift({
        id: 'log_' + Date.now(),
        actor: 'Admin',
        action: 'Media Uploaded',
        resource: action.payload.name,
        details: `File size: ${(action.payload.size / 1024).toFixed(1)} KB`,
        timestamp: new Date().toISOString(),
      });
    },
    deleteMediaAsset: (state, action: PayloadAction<string>) => {
      state.mediaAssets = state.mediaAssets.filter((m) => m.id !== action.payload);
    },

    // Filter controls
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setSelectedBrand: (state, action: PayloadAction<string | null>) => {
      state.selectedBrand = action.payload;
    },
    setPriceRange: (state, action: PayloadAction<[number, number]>) => {
      state.priceRange = action.payload;
    },
    setSortBy: (
      state,
      action: PayloadAction<'featured' | 'price-low' | 'price-high' | 'rating' | 'newest'>
    ) => {
      state.sortBy = action.payload;
    },
    resetFilters: (state) => {
      state.selectedCategory = null;
      state.selectedBrand = null;
      state.priceRange = [0, 2000];
      state.sortBy = 'featured';
    },
  },
});

export const {
  hydrateCatalog,
  hydrateAuditLogs,
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  updateBanner,
  addReview,
  addMediaAsset,
  deleteMediaAsset,
  setSelectedCategory,
  setSelectedBrand,
  setPriceRange,
  setSortBy,
  resetFilters,
} = productSlice.actions;

export const selectAllProducts = (state: { products: ProductState }) => state.products.products;
export const selectAllCategories = (state: { products: ProductState }) => state.products.categories;
export const selectAllBrands = (state: { products: ProductState }) => state.products.brands;
export const selectAllBanners = (state: { products: ProductState }) => state.products.banners;
export const selectReviews = (state: { products: ProductState }) => state.products.reviews;
export const selectAuditLogs = (state: { products: ProductState }) => state.products.auditLogs;
export const selectMediaAssets = (state: { products: ProductState }) => state.products.mediaAssets;
export const selectCatalogLoaded = (state: { products: ProductState }) =>
  state.products.catalogLoaded;
export const selectFilters = (state: { products: ProductState }) => ({
  category: state.products.selectedCategory,
  brand: state.products.selectedBrand,
  priceRange: state.products.priceRange,
  sortBy: state.products.sortBy,
});

export default productSlice.reducer;
