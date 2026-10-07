import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { addNotification } from '../../store/slices/uiSlice';
import { useAppDispatch } from '../../store/hooks';
import { ApiError } from '../../services/api';
import {
  MAX_IMAGE_BYTES,
  uploadImageFile,
  validateImageFile,
} from '../../services/mediaUpload';
import { MediaAsset } from '../../types';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * Single-image picker for admin forms.
 *
 * Opens the browser's native file explorer (`<input type="file">`, visually
 * hidden), validates the selected file, uploads it through the existing media
 * API immediately, and hands the persisted media reference to the form. The
 * form never holds a `blob:` URL: preview uses the durable data URL the media
 * system returned, so saving right after selecting is always consistent.
 */
export const ImageUploadField: React.FC<{
  /** Current durable image reference (data URL from the media system). */
  value: string;
  onChange: (url: string) => void;
  /** Accessible label, e.g. "Main image". Drives the button copy. */
  label: string;
  /** Show a clear/remove control when an image is present. */
  allowRemove?: boolean;
  required?: boolean;
}> = ({ value, onChange, label, allowRemove = true, required = false }) => {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always reset so picking the same file again still fires `change`.
    e.target.value = '';
    if (!file || uploading) return;

    const problem = validateImageFile(file);
    if (problem) {
      dispatch(
        addNotification({ type: 'warning', title: 'Image Not Valid', message: problem, duration: 4000 })
      );
      return;
    }

    setUploading(true);
    try {
      const asset = await uploadImageFile(file);
      onChange(asset.url);
      dispatch(
        addNotification({
          type: 'success',
          title: 'Image Ready',
          message: `${file.name} was uploaded and attached.`,
          duration: 3000,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message:
            err instanceof ApiError
              ? err.message
              : `The image could not be uploaded. Images must be under ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`,
          duration: 4500,
        })
      );
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    if (!value) return;
    onChange('');
    // Revoke nothing: the media library retains the asset; only this form
    // field stops referencing it.
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>

      <div
        className={`relative w-full max-w-[240px] mx-auto sm:mx-0 aspect-square rounded-2xl border overflow-hidden flex items-center justify-center transition-colors ${
          value ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50'
        }`}
      >
        {value ? (
          <img
            src={value}
            alt={`${label} preview`}
            className="absolute inset-0 w-full h-full object-contain p-2"
          />
        ) : (
          <div className="text-center px-3">
            <ImagePlus className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="mt-1 text-[11px] text-slate-400">No image selected</p>
          </div>
        )}
        {uploading && (
          <div
            className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1.5"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-slate-700">Uploading…</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleSelect}
          className="sr-only"
          aria-label={`Select an image file for ${label}`}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${buttonBase} px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow-xs`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{value ? `Replace ${label}` : `Choose ${label}`}</span>
            </>
          )}
        </button>
        {value && allowRemove && (
          <button
            type="button"
            onClick={remove}
            className={`${buttonBase} px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Remove</span>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Multi-image picker for product gallery management.
 * Preserves ordering: newly chosen files are appended after the existing list.
 */
export const GalleryUploadField: React.FC<{
  /** Ordered gallery image references (durable data URLs). */
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}> = ({ value, onChange, label = 'Gallery images' }) => {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0 || uploading) return;

    const problems = files.map(validateImageFile).filter(Boolean) as string[];
    if (problems.length > 0) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Image Not Valid',
          message: problems[0],
          duration: 4000,
        })
      );
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const asset = await uploadImageFile(file);
        uploaded.push(asset.url);
      }
      // Append to keep existing ordering intact.
      onChange([...value, ...uploaded]);
      dispatch(
        addNotification({
          type: 'success',
          title: 'Gallery Updated',
          message: `${uploaded.length} image${uploaded.length === 1 ? '' : 's'} added.`,
          duration: 3000,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message:
            err instanceof ApiError
              ? err.message
              : 'One of the gallery images could not be uploaded.',
          duration: 4500,
        })
      );
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</span>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label={`${label} preview`}>
          {value.map((url, index) => (
            <li
              key={`${url.slice(-24)}-${index}`}
              className="relative w-20 h-20 rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute top-1 right-1 p-1 rounded-lg bg-white/90 text-rose-600 hover:bg-white transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                aria-label={`Remove gallery image ${index + 1}`}
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleSelect}
          className="sr-only"
          aria-label={`Select image files to add to the ${label.toLowerCase()}`}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${buttonBase} px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Gallery Images</span>
            </>
          )}
        </button>
        <span className="text-[11px] text-slate-500">
          {value.length} image{value.length === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
};
