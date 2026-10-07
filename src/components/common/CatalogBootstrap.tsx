import { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { hydrateCatalog } from '../../store/slices/productSlice';
import { api } from '../../services/api';

/**
 * Loads the live catalog into Redux once, at application start.
 *
 * Without this step every screen renders the bundled seed records from
 * `services/mockData.ts`, so anything written by the admin console would be
 * invisible until a hard refresh — and would still be overwritten by the seed.
 * Each read is tolerant: an unreachable API leaves the existing state intact
 * rather than blanking the storefront.
 *
 * Orders are deliberately NOT loaded here. `GET /orders` is scoped to the
 * signed-in customer, and an anonymous visitor must not receive an order book.
 */
export const CatalogBootstrap: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [products, categories, brands, banners, media] = await Promise.all([
        api.getProducts().catch(() => undefined),
        api.getCategories().catch(() => undefined),
        api.getBrands().catch(() => undefined),
        api.getBanners().catch(() => undefined),
        api.getMedia().catch(() => undefined),
      ]);

      if (cancelled) return;

      dispatch(
        hydrateCatalog({
          products,
          categories,
          brands,
          banners,
          mediaAssets: media,
        })
      );
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
};