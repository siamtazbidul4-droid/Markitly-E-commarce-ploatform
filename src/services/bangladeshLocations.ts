/**
 * Bangladesh administrative hierarchy: Division -> District -> Upazila -> Union.
 *
 * Source of truth is the `bd-address` package (8 divisions, 64 districts, 495
 * upazilas, 4540 unions). Nothing here is hand-written: the checkout and account
 * address forms previously shipped a hard-coded 8-item division list with free
 * text district/upazila/union fields and placeholder defaults ("Gulshan",
 * "Ward 19", "1212"), which accepted any value and could not produce a valid
 * address combination.
 *
 * Only `divisions`, `districts`, `upazillas` and `unions` are imported. The
 * package's barrel file also pulls in a 561 KB postal-code table that this
 * project never uses, so importing the individual data modules keeps the client
 * bundle meaningfully smaller. See `src/types/bd-address.d.ts` for their shapes.
 *
 * The dataset is loaded lazily on first use. It is roughly 800 KB of raw JSON and
 * is only needed once a visitor reaches a form that collects an address, so it is
 * split into its own chunk instead of weighing down every page.
 *
 * Ids, not names, drive the cascade: union names repeat across upazilas, so a
 * name-keyed selection could not tell two different unions apart. The human
 * readable name is what gets persisted, matching the existing `Order` and `User`
 * address schemas (all four fields are strings) and keeping every order already
 * in the database valid.
 */

export interface LocationOption {
  /** Stable identifier from the dataset. */
  id: string;
  /** English name, which is what the forms display and store. */
  name: string;
}

export interface BangladeshLocationData {
  divisions: LocationOption[];
  districtsByDivision: Record<string, LocationOption[]>;
  upazilasByDistrict: Record<string, LocationOption[]>;
  unionsByUpazila: Record<string, LocationOption[]>;
}

let cached: Promise<BangladeshLocationData> | null = null;

const toOption = (row: { id: string; name: string }): LocationOption => ({
  id: String(row.id),
  name: row.name,
});

/** Loads (and memoises) the full hierarchy. Safe to call from any component. */
export const loadBangladeshLocations = (): Promise<BangladeshLocationData> => {
  if (cached) return cached;

  cached = (async () => {
    const [divisions, districts, upazilas, unions] = await Promise.all([
      import('bd-address/assets/divisions.js'),
      import('bd-address/assets/districts.js'),
      import('bd-address/assets/upazillas.js'),
      import('bd-address/assets/unions.js'),
    ]);

    /** Indexes a level by its parent foreign key so each lookup is O(1). */
    const groupByParent = <T extends { id: string; name: string }>(
      rows: T[],
      parentKey: string
    ): Record<string, LocationOption[]> => {
      const grouped: Record<string, LocationOption[]> = {};
      for (const row of rows) {
        const parent = String((row as unknown as Record<string, string>)[parentKey]);
        (grouped[parent] ||= []).push(toOption(row));
      }
      return grouped;
    };

    return {
      divisions: divisions.default.map(toOption),
      districtsByDivision: groupByParent(districts.default, 'division_id'),
      upazilasByDistrict: groupByParent(upazilas.default, 'district_id'),
      unionsByUpazila: groupByParent(unions.default, 'upazilla_id'),
    };
  })();

  return cached;
};

/** Test seam: drops the memoised dataset. */
export const resetBangladeshLocationsCache = (): void => {
  cached = null;
};

export const getDivisions = (data: BangladeshLocationData): LocationOption[] =>
  data.divisions;

export const getDistricts = (
  data: BangladeshLocationData,
  divisionId: string
): LocationOption[] => (divisionId ? data.districtsByDivision[divisionId] ?? [] : []);

export const getUpazilas = (
  data: BangladeshLocationData,
  districtId: string
): LocationOption[] => (districtId ? data.upazilasByDistrict[districtId] ?? [] : []);

export const getUnions = (
  data: BangladeshLocationData,
  upazilaId: string
): LocationOption[] => (upazilaId ? data.unionsByUpazila[upazilaId] ?? [] : []);

/** Resolves a stored human-readable name back to its dataset id. */
export const findOptionId = (options: LocationOption[], name: string | undefined): string => {
  if (!name) return '';
  const match = options.find((option) => option.name === name);
  return match ? match.id : '';
};