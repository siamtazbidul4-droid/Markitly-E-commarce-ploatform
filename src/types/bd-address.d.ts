/**
 * Ambient types for the `bd-address` data modules.
 *
 * The package ships plain JavaScript with no type declarations, so TypeScript
 * cannot infer the shape of the location dataset. These declarations describe
 * only the fields this project actually consumes; the upstream objects also
 * carry `bn_name` and `url`, which are left out deliberately rather than
 * restated as `any`.
 *
 * Only the four data modules the checkout and account address forms use are
 * declared. The package's barrel `index.js` is deliberately NOT declared: it
 * also pulls in a 561 KB postal-code table this project never uses, so
 * `bangladeshLocations.ts` imports the individual modules and code-splits them.
 *
 * `bd-address` has no `exports` map, so these deep specifiers resolve directly
 * against `node_modules/bd-address/assets/`.
 */

interface BdAddressRecord {
  /** Stable identifier. Unique only within its own level. */
  id: string;
  /** English name. This is the value the forms display and persist. */
  name: string;
}

interface BdAddressDivision extends BdAddressRecord {
  bn_name: string;
  url: string;
}

interface BdAddressDistrict extends BdAddressRecord {
  /** Foreign key onto `divisions.id`. */
  division_id: string;
  bn_name: string;
  url: string;
}

interface BdAddressUpazilla extends BdAddressRecord {
  /** Foreign key onto `districts.id`. */
  district_id: string;
  bn_name: string;
  url: string;
}

interface BdAddressUnion extends BdAddressRecord {
  /** Foreign key onto `upazillas.id`. */
  upazilla_id: string;
  bn_name: string;
  url: string;
}

declare module 'bd-address/assets/divisions.js' {
  const divisions: BdAddressDivision[];
  export default divisions;
}

declare module 'bd-address/assets/districts.js' {
  const districts: BdAddressDistrict[];
  export default districts;
}

declare module 'bd-address/assets/upazillas.js' {
  const upazillas: BdAddressUpazilla[];
  export default upazillas;
}

declare module 'bd-address/assets/unions.js' {
  const unions: BdAddressUnion[];
  export default unions;
}