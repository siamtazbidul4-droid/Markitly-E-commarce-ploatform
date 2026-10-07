import React, { useState } from 'react';
import { FolderTree, Plus, CheckCircle2 } from 'lucide-react';

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

const initialCollections: CollectionItem[] = [
  {
    id: 'col_1',
    name: 'Executive Computing Suite',
    slug: 'executive-computing',
    description: 'Workstations, M2 laptops, precision mechanical keyboards.',
    productCount: 12,
  },
  {
    id: 'col_2',
    name: 'Signature Titanium Watches',
    slug: 'signature-titanium-watches',
    description: 'Aerospace-grade titanium smart and automatic timepieces.',
    productCount: 8,
  },
  {
    id: 'col_3',
    name: 'Summer Athletic Footwear',
    slug: 'summer-athletic-footwear',
    description: 'Air cushion runners and technical lifestyle sneakers.',
    productCount: 16,
  },
];

export const AdminCollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState(initialCollections);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newCol: CollectionItem = {
      id: 'col_' + Date.now(),
      name: name.trim(),
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: description.trim() || 'Curated luxury lifestyle collection.',
      productCount: 0,
    };
    setCollections([...collections, newCol]);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Curated Collections
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Group products into seasonal lookbooks and themed campaigns for storefront merchandising.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Create Collection</span>
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Collection Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Autumn Leather & Accessories"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Editorial Description
              </label>
              <textarea
                rows={3}
                placeholder="Curatorial statement..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Collection
            </button>
          </form>
        </div>

        {/* Collections List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Active Collections ({collections.length})
          </h2>

          <div className="space-y-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold text-base text-slate-900">{col.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{col.description}</p>
                  <span className="text-[11px] font-mono text-blue-600 mt-1 block">
                    /{col.slug} · {col.productCount} associated items
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold self-start sm:self-center">
                  Live on Storefront
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
