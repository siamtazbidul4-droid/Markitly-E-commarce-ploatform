import React, { useEffect, useMemo, useState } from 'react';
import {
  findOptionId,
  getDistricts,
  getDivisions,
  getUnions,
  getUpazilas,
  loadBangladeshLocations,
  BangladeshLocationData,
  LocationOption,
} from '../../services/bangladeshLocations';
import { Loader2 } from 'lucide-react';

/**
 * Dependent Division -> District -> Upazila -> Union selector.
 *
 * Behaviour the checkout and account address forms both need:
 *  - every level's options are derived from the current parent selection;
 *  - changing a parent clears each downstream level, so a district belonging to
 *    the previous division can never survive as a submitted combination;
 *  - a level with no options renders disabled with an explanatory placeholder
 *    rather than keeping a stale value;
 *  - the dataset loads lazily, so a loading state is shown while it arrives;
 *  - every control is a labelled `<select>`, so it is keyboard navigable and
 *    exposed correctly to assistive technology.
 *
 * The cascade is derived from the stored *names* on every render rather than
 * mirrored into separate id state. Names are what the order and user address
 * schemas persist, and the dataset id is looked up from the name with
 * `findOptionId`, which removes any chance of the two representations drifting
 * apart (the previous free-text implementation had exactly that problem).
 */

const CONTROL_CLASS =
  'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed';

export interface BangladeshLocationValue {
  division: string;
  district: string;
  upazila: string;
  union: string;
}

interface LocationSelectProps {
  id: string;
  label: string;
  required?: boolean;
  disabled: boolean;
  value: string;
  /** Shown when the control is enabled but has nothing selected yet. */
  placeholder: string;
  /** Shown when the control is disabled because a parent is not chosen yet. */
  blockedHint: string;
  emptyMessage: string;
  options: LocationOption[];
  onChange: (value: string) => void;
}

const LocationSelect: React.FC<LocationSelectProps> = ({
  id,
  label,
  required,
  disabled,
  value,
  placeholder,
  blockedHint,
  emptyMessage,
  options,
  onChange,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
      {label}
      {required ? ' *' : ''}
    </label>
    <select
      id={id}
      name={id}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${CONTROL_CLASS} cursor-pointer`}
    >
      <option value="">{disabled ? blockedHint : placeholder}</option>
      {/* Distinguishes "not chosen yet" from "this level has no children". */}
      {!disabled && options.length === 0 ? (
        <option value="" disabled>
          {emptyMessage}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.id} value={option.name}>
          {option.name}
        </option>
      ))}
    </select>
  </div>
);

interface Props {
  /** Prefix for generated element ids so multiple instances stay unique. */
  idPrefix: string;
  value: BangladeshLocationValue;
  onChange: (next: BangladeshLocationValue) => void;
}

export const BangladeshLocationFields: React.FC<Props> = ({ idPrefix, value, onChange }) => {
  const [data, setData] = useState<BangladeshLocationData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadBangladeshLocations()
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch(() => {
        // Surfaced, never silently degraded into free-text inputs.
        if (active) setLoadError('Bangladesh location data could not be loaded. Please reload the page.');
      });
    return () => {
      active = false;
    };
  }, []);

  // Parent -> id -> children, recomputed from the current selection each render.
  const divisions = useMemo(() => (data ? getDivisions(data) : []), [data]);
  const selectedDivisionId = findOptionId(divisions, value.division);
  const districts = useMemo(
    () => (data ? getDistricts(data, selectedDivisionId) : []),
    [data, selectedDivisionId]
  );
  const selectedDistrictId = findOptionId(districts, value.district);
  const upazilas = useMemo(
    () => (data ? getUpazilas(data, selectedDistrictId) : []),
    [data, selectedDistrictId]
  );
  const selectedUpazilaId = findOptionId(upazilas, value.upazila);
  const unions = useMemo(
    () => (data ? getUnions(data, selectedUpazilaId) : []),
    [data, selectedUpazilaId]
  );

  const loading = !data && !loadError;

  if (loadError) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
        {loadError}
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div
          role="status"
          className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500"
        >
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Loading Bangladesh locations…</span>
        </div>
      ) : null}

      <LocationSelect
        id={`${idPrefix}-division`}
        label="Division"
        required
        disabled={loading}
        value={value.division}
        placeholder="Select Division"
        blockedHint="Loading…"
        emptyMessage="No divisions available"
        options={divisions}
        onChange={(name) =>
          // Every downstream level is cleared with the parent.
          onChange({ division: name, district: '', upazila: '', union: '' })
        }
      />

      <LocationSelect
        id={`${idPrefix}-district`}
        label="District / Zila"
        required
        disabled={loading || !value.division}
        value={value.district}
        placeholder="Select District"
        blockedHint="Select a Division first"
        emptyMessage="No districts available"
        options={districts}
        onChange={(name) => onChange({ ...value, district: name, upazila: '', union: '' })}
      />

      <LocationSelect
        id={`${idPrefix}-upazila`}
        label="Upazila / Thana"
        required
        disabled={loading || !value.district}
        value={value.upazila}
        placeholder="Select Upazila"
        blockedHint="Select a District first"
        emptyMessage="No upazilas available"
        options={upazilas}
        onChange={(name) => onChange({ ...value, upazila: name, union: '' })}
      />

      <LocationSelect
        id={`${idPrefix}-union`}
        label="Union / Ward"
        disabled={loading || !value.upazila}
        value={value.union}
        placeholder="Select Union"
        blockedHint="Select an Upazila first"
        emptyMessage="No unions available"
        options={unions}
        onChange={(name) => onChange({ ...value, union: name })}
      />
    </>
  );
};
