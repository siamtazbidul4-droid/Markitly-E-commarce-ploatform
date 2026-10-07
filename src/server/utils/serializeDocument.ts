/**
 * Shared response serialisation for Mongo documents.
 *
 * Mongoose exposes `_id`, while every client model (`src/types/index.ts`) and
 * every client component is keyed on `id`. Read endpoints that returned raw
 * documents therefore handed the browser `product.id === undefined`, which in
 * turn broke wishlist membership, cart `productId` values and checkout.
 *
 * Every controller must run its documents through `serializeDocument` (or a
 * thin wrapper such as `serializeMany`) so the API contract stays identical
 * whether a record came from MongoDB or from the in-memory fallback store.
 */

interface MongoLike {
  _id?: unknown;
  id?: unknown;
  toJSON?: () => Record<string, unknown>;
}

const toPlainObject = (doc: unknown): Record<string, unknown> => {
  const source = doc as MongoLike | null | undefined;
  if (source && typeof source.toJSON === 'function') {
    return source.toJSON();
  }
  return { ...(source as object) } as Record<string, unknown>;
};

/** Normalises one document so `id` is always a string, mirroring `src/types`. */
export const serializeDocument = (doc: unknown): Record<string, unknown> => {
  const plain = toPlainObject(doc);
  const rawId = plain._id ?? plain.id;
  return { ...plain, id: rawId === undefined || rawId === null ? '' : String(rawId) };
};

/** Normalises a list of documents, preserving order. */
export const serializeMany = (docs: unknown[]): Record<string, unknown>[] =>
  docs.map(serializeDocument);