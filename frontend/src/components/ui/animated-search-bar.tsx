"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { fetchArtistSuggestions, ArtistSuggestion } from "@/lib/api";

/* ─── SVG filter for gooey effect ─────────────────────── */
const GooeyFilter = () => (
  <svg aria-hidden="true" className="absolute w-0 h-0">
    <defs>
      <filter id="goo-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feColorMatrix
          in="blur" type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
);

/* ─── Animated magnifier ───────────────────────────────── */
const SearchIcon = ({ isUnsupported }: { isUnsupported: boolean }) => (
  <motion.svg
    initial={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }}
    animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }}
    transition={{ delay: 0.1, duration: 1, type: "spring", bounce: 0.15 }}
    width="18" height="18" viewBox="0 0 15 15" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white/60"
  >
    <path
      d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
      fill="currentColor" fillRule="evenodd" clipRule="evenodd"
    />
  </motion.svg>
);

/* ─── Loading spinner ──────────────────────────────────── */
const LoadingIcon = () => (
  <svg className="w-4 h-4 animate-spin text-white/50" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

/* ─── Debounce hook ────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Props ────────────────────────────────────────────── */
interface AnimatedSearchBarProps {
  onSearch: (query: string, isId?: boolean) => void;
  isLoading: boolean;
}

/* ─── Main component ───────────────────────────────────── */
export const AnimatedSearchBar = ({ onSearch, isLoading }: AnimatedSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<ArtistSuggestion[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const debouncedText = useDebounce(searchText, 450);

  const isUnsupported = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium");
  }, []);

  /* focus input when step expands */
  useEffect(() => {
    if (step === 2) inputRef.current?.focus();
    else { setSearchText(""); setSuggestions([]); }
  }, [step]);

  /* fetch suggestions */
  useEffect(() => {
    let cancelled = false;
    if (debouncedText.length >= 2) {
      setIsFetching(true);
      fetchArtistSuggestions(debouncedText).then(res => {
        if (!cancelled) { setSuggestions(res); setIsFetching(false); }
      }).catch(() => { if (!cancelled) setIsFetching(false); });
    } else {
      setSuggestions([]);
    }
    return () => { cancelled = true; };
  }, [debouncedText]);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setStep(1);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (s: ArtistSuggestion) => {
    setStep(1);
    onSearch(s.id, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchText.trim()) {
      setStep(1);
      onSearch(searchText.trim(), false);
    }
    if (e.key === "Escape") setStep(1);
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col items-center">
      <GooeyFilter />

      {/* Pill button / input */}
      <div
        className={clsx(
          "relative flex items-center overflow-hidden rounded-full transition-all duration-500",
          "bg-white/8 border border-white/12 backdrop-blur-md shadow-lg shadow-black/30",
          step === 1 ? "w-36 h-12 cursor-pointer hover:bg-white/12" : "w-80 sm:w-96 h-12"
        )}
        style={{ filter: isUnsupported ? "none" : undefined }}
        onClick={() => step === 1 && setStep(2)}
      >
        {step === 1 ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-center text-sm font-semibold text-white/70 select-none"
          >
            Search artist
          </motion.span>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center w-full px-4 gap-3"
          >
            <AnimatePresence mode="wait">
              {isFetching || isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoadingIcon />
                </motion.div>
              ) : (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SearchIcon isUnsupported={isUnsupported} />
                </motion.div>
              )}
            </AnimatePresence>
            <input
              ref={inputRef}
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for an artist…"
              className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm font-medium outline-none"
            />
          </motion.div>
        )}
      </div>

      {/* Dropdown results — rendered in a portal-like fixed layer */}
      <AnimatePresence>
        {step === 2 && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, type: "spring", bounce: 0.2 }}
            className="absolute top-[calc(100%+10px)] left-0 right-0 z-[999] rounded-2xl overflow-hidden
                       bg-[#111118]/95 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/60"
          >
            <ul className="flex flex-col max-h-72 overflow-y-auto py-1.5">
              {suggestions.map((s, i) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 transition-colors text-left group"
                  >
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/30 flex-shrink-0 flex items-center justify-center">
                        <span className="text-sm font-black text-indigo-300">{s.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{s.name}</p>
                      {(s.disambiguation || s.country) && (
                        <p className="text-xs text-white/35 truncate">
                          {[s.disambiguation, s.country].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
