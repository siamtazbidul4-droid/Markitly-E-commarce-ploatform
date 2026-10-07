import React, { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectMediaAssets, addMediaAsset, deleteMediaAsset } from '../../store/slices/productSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { api, ApiError } from '../../services/api';
import { uploadImageFile } from '../../services/mediaUpload';
import { MediaAsset } from '../../types';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmAction = useConfirm();
  const mediaAssets = useAppSelector(selectMediaAssets);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    // Allow re-selecting the same file after a failed attempt.
    e.target.value = '';

    setUploading(true);
    try {
      // Shared pipeline: validation, durable data URL and persistence through
      // the existing media API (same path used by every admin image field).
      const asset = await uploadImageFile(file);
      dispatch(addMediaAsset(asset));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Asset Uploaded',
          message: `${file.name} was added to the media library.`,
          duration: 3000,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message:
            err instanceof ApiError ? err.message : 'The asset could not be uploaded. Try again.',
          duration: 4500,
        })
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction({
      title: 'Confirm media deletion',
      message: `Delete “${name}” from the media library? Products still referencing this asset will show a broken image.`,
      confirmText: 'Delete asset',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await api.deleteMedia(id);
      dispatch(deleteMediaAsset(id));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Asset Removed',
          message: `“${name}” was deleted from the media library.`,
          duration: 3000,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message:
            err instanceof ApiError ? err.message : 'The asset could not be deleted. Try again.',
          duration: 4500,
        })
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Central Media Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Native file explorer upload, Cloudinary asset proxy, format inspection, and metadata tracking.
          </p>
        </div>

        <div>
<input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>{uploading ? 'Uploading…' : 'Upload New Media'}</span>
          </button>
        </div>
      </div>

      {mediaAssets.length === 0 ? (
        <div className="px-5 py-16 text-center bg-white rounded-3xl border border-slate-200/80">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-700">The media library is empty.</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload product photography to reuse it across the catalog.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaAssets.map((asset) => (
            <li
              key={asset.id}
              className="group relative rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-2 hover:shadow-md transition-all"
            >
              <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden p-2 flex items-center justify-center">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <div className="px-1">
                <p className="text-xs font-bold text-slate-900 truncate">{asset.name}</p>
                <p className="text-[10px] text-slate-400">
                  {(asset.size / 1024).toFixed(0)} KB · {asset.format}
                  {asset.dimensions ? ` · ${asset.dimensions}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(asset.id, asset.name)}
                disabled={deletingId === asset.id}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/90 text-rose-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-xs disabled:opacity-50"
                title="Delete media"
                aria-label={`Delete ${asset.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
