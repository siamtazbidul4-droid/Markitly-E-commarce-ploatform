import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Product } from '../../types';
import { Search, Loader2, PackageSearch } from 'lucide-react';

type SuggestionStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** `rounded-full` for the desktop bar, `rounded-xl` for the mobile sheet. */
  shape?: 'pill' | 'rounded';
  placeholder?: string;
  /** Accessible name for the combobox input. */
  label: string;
  autoFocusOnMount?: boolean;
}

/**
 * A single character is enough to search. The debounce plus the six-result cap
 * keep this cheap, and blocking the first keystroke made the field feel dead.
 */
const MIN_QUERY_LENGTH = 1;
const DEBOUNCE_MS = 220;
const MAX_SUGGESTIONS = 6;

/**
 * Live search suggestions for the storefront header.
 *
 * Suggestions come from the existing `GET /api/v1/products?search=` endpoint, so
 * no second search system or duplicated catalog exists. Requests are debounced
 * and tagged with an incrementing sequence number: a slow response for an older
 * keystroke is discarded instead of overwriting newer results.
 *
 * Keyboard support follows the ARIA combobox pattern - ArrowUp/ArrowDown to move,
 * Enter to accept, Escape to dismiss - and the list closes on outside pointer
 * interaction so it never traps the page on a touch device.
 */
export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  onSubmit,
  shape = 'pill',
  placeholder = 'Search for products, brands and more...',
  label,
  autoFocusOnMount = false,
}) => {
  const navigate = useNavigate();
  const listId = useId();

  const [isFocused, setIsFocused] = useState(false);
  const [status, setStatus] = useState<SuggestionStatus>('idle');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const requestSeqRef = useRef(0);

  const trimmed = value.trim();
  const isOpen = isFocused && trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (autoFocusOnMount) inputRef.current?.focus();
  }, [autoFocusOnMount]);

  // Debounced lookup. Every keystroke schedules a request; only the newest one
  // is allowed to write results.
  useEffect(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);

    if (trimmed.length < MIN_QUERY_LENGTH) {
      requestSeqRef.current += 1;
      setSuggestions([]);
      setStatus('idle');
      setActiveIndex(-1);
      return;
    }

    const seq = ++requestSeqRef.current;
    setStatus('loading');

    debounceRef.current = window.setTimeout(() => {
      api
        .getProducts({ search: trimmed, limit: String(MAX_SUGGESTIONS) })
        .then((results) => {
          if (seq !== requestSeqRef.current) return;
          setSuggestions(Array.isArray(results) ? results.slice(0, MAX_SUGGESTIONS) : []);
          setStatus('ready');
          setActiveIndex(-1);
        })
        .catch(() => {
          if (seq !== requestSeqRef.current) return;
          setSuggestions([]);
          setStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [trimmed]);

  // Close on any interaction outside the field. `pointerdown` fires before the
  // input's blur, so a tap on a suggestion is not swallowed by the close.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: Event) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const closeAndClear = useCallback(() => {
    setIsFocused(false);
    setActiveIndex(-1);
  }, []);

  const accept = useCallback(
    (product: Product) => {
      closeAndClear();
      onChange('');
      navigate(`/product/${product.slug}`);
    },
    [closeAndClear, navigate, onChange]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        accept(suggestions[activeIndex]);
        return;
      }
      if (!trimmed) return;
      closeAndClear();
      onSubmit(trimmed);
    },
    [accept, activeIndex, closeAndClear, onSubmit, suggestions, trimmed]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        closeAndClear();
        return;
      }
      if (!isOpen || suggestions.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((idx) => (idx + 1) % suggestions.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((idx) => (idx <= 0 ? suggestions.length - 1 : idx - 1));
      }
    },
    [closeAndClear, isOpen, suggestions.length]
  );

  const borderRadius = shape === 'pill' ? 'rounded-full' : 'rounded-xl';
  const buttonRadius = shape === 'pill' ? 'rounded-full' : 'rounded-lg';
  const showPanel = isOpen && (status === 'loading' || status === 'ready' || status === 'empty' || status === 'error');

  const panel = useMemo(() => {
    if (!showPanel) return null;

    if (status === 'loading') {
      return (
        <div className="flex items-center gap-2.5 px-4 py-3.5 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
          <span>Searching…</span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="px-4 py-3.5 text-xs font-semibold text-slate-500">
          Search is unavailable right now. Press Enter to browse the full catalog.
        </div>
      );
    }

    if (status === 'empty' || suggestions.length === 0) {
      return (
        <div className="px-4 py-3.5 text-xs text-slate-500">
          No matches for <span className="font-semibold text-slate-700">“{trimmed}”</span>.
        </div>
      );
    }

    return (
      <ul role="listbox" aria-label="Search suggestions" className="max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain py-1.5">
        {suggestions.map((product, index) => (
          <li key={product.id} role="option" aria-selected={index === activeIndex}>
            <button
              type="button"
              // `onMouseDown` so the click lands before the outside-pointer
              // handler tears the panel down.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => accept(product)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                index === activeIndex ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <span className="w-10 h-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                {product.mainImage ? (
                  <img
                    src={product.mainImage}
                    alt=""
                    className="w-full h-full object-contain mix-blend-multiply"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <PackageSearch className="w-4 h-4 text-slate-300" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-900 truncate">{product.name}</span>
                <span className="block text-[11px] text-slate-500 truncate">
                  {product.category}
                  {product.brand ? ` · ${product.brand}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-xs font-extrabold text-slate-900 tabular-nums">
                ${product.price.toFixed(2)}
              </span>
            </button>
          </li>
        ))}
        <li className="border-t border-slate-100 mt-1 pt-1">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              closeAndClear();
              onSubmit(trimmed);
            }}
            className="w-full px-3 py-2.5 text-left text-[11px] font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <span>See all results for “{trimmed}”</span>
          </button>
        </li>
      </ul>
    );
  }, [accept, closeAndClear, listId, onSubmit, showPanel, status, suggestions, activeIndex, trimmed]);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} role="search" className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={showPanel ? listId : undefined}
            aria-autocomplete="list"
            aria-label={label}
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Deferred so a click on a suggestion still resolves.
              window.setTimeout(closeAndClear, 120);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full pl-11 ${shape === 'pill' ? 'pr-14' : 'pr-12'} py-2.5 bg-slate-50 border border-slate-200 ${borderRadius} text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all`}
          />
          <button
            type="submit"
            aria-label="Submit search"
            className={`absolute right-1 top-1 bottom-1 ${shape === 'pill' ? 'w-10' : 'w-9'} bg-blue-600 hover:bg-blue-700 text-white ${buttonRadius} flex items-center justify-center transition-colors`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {showPanel && (
        <div
          id={listId}
          // Anchored to the field, above page content, scroll-safe on mobile.
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden"
        >
          {panel}
          {status === 'ready' && suggestions.length > 0 && (
            <p className="sr-only" aria-live="polite">
              {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'} available. Use the up
              and down arrow keys to review them.
            </p>
          )}
        </div>
      )}
    </div>
  );
};