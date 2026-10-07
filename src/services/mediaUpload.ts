import { api, ApiError } from './api';
import { MediaAsset } from '../types';

/**
 * Shared image upload pipeline for every Admin Panel media field.
 *
 * The project's existing media architecture (see `AdminMediaPage` and
 * `POST /api/v1/media`) persists a self-contained base64 data URL as the asset
 * `url` - there is no external storage service configured in this repository,
 * so that is the architecture this module reuses. Nothing here invents a second
 * storage system; it only factors the validation + upload steps that were
 * previously duplicated (or missing) so product, category and banner forms can
 * share one implementation.
 *
 * Security: validation is duplicated server-side in
 * `createMediaAsset` (backend is authoritative); these checks give the
 * administrator fast feedback before any bytes leave the browser.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Returns an error message when the file is not an acceptable image, else null. */
export const validateImageFile = (file: File): string | null => {
  if (file.size === 0) return 'The selected file is empty.';
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase()))
    return 'Only JPEG, PNG, WebP or GIF images are supported.';
  if (file.size > MAX_IMAGE_BYTES)
    return 'Images must be 5 MB or smaller. Please choose a smaller file.';
  return null;
};

/** Reads a browser `File` into a self-contained base64 data URL. */
export const readAsDataUrl = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

/** Reads the real pixel dimensions instead of assuming a fixed size. */
export const measureImage = (src: string): Promise<string> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(`${image.naturalWidth}x${image.naturalHeight}`);
    image.onerror = () => resolve('Unknown');
    image.src = src;
  });

/**
 * Validates, reads and registers a local image through the existing media API.
 * Resolves with the persisted `MediaAsset` whose `url` is safe to store on any
 * entity (it is a data URL, never a temporary blob: reference).
 */
export const uploadImageFile = async (file: File): Promise<MediaAsset> => {
  const validationError = validateImageFile(file);
  if (validationError) throw new ApiError(validationError, 400);

  const dataUrl = await readAsDataUrl(file);
  if (!dataUrl) throw new ApiError('The file could not be read. Please try again.', 400);

  const dimensions = await measureImage(dataUrl);

  const draft: MediaAsset = {
    id: '',
    name: file.name,
    url: dataUrl,
    format: file.name.split('.').pop()?.toUpperCase() || 'JPG',
    size: file.size,
    dimensions,
    uploadedAt: new Date().toISOString(),
    folder: 'Storefront',
  };

  // The server persists the asset and returns the authoritative record.
  const saved = await api.uploadMedia(draft);
  return { ...draft, ...saved, id: String(saved.id) };
};
