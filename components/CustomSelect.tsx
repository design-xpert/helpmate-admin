"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, CheckCircle2, Plus, Search, Loader2, X } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface CustomSelectProps {
  label?: string;
  value: string;
  selectedValues?: string[];
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  onAddAction?: () => void;
  addActionLabel?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  isSearching?: boolean;
  menuPlacement?: "auto" | "top" | "bottom";
}

export function CustomSelect({
  label,
  value,
  selectedValues,
  onChange,
  options,
  placeholder = "Select option...",
  onAddAction,
  addActionLabel,
  className = "",
  disabled = false,
  size = "md",
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  isSearching = false,
  menuPlacement = "auto",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openTop, setOpenTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (menuPlacement === "top") {
        setOpenTop(true);
      } else if (menuPlacement === "bottom") {
        setOpenTop(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenTop(spaceBelow < 250);
      }
    }
  }, [isOpen, menuPlacement]);

  const selectedOption = options.find(
    (opt) =>
      opt.value === value ||
      (Boolean(value) && opt.label?.toLowerCase().trim() === value?.toLowerCase().trim())
  );

  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="font-semibold text-slate-900 dark:text-white block text-xs">
            {label}
          </label>
          {onAddAction && addActionLabel && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddAction();
              }}
              className="text-brand-600 dark:text-brand-400 hover:underline font-medium text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addActionLabel.replace(/^\+\s*/, "")}</span>
            </button>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full ${
          size === "sm" ? "h-9 px-2.5 rounded-xl text-xs" : "h-[42px] px-3 rounded-xl text-xs"
        } border bg-white dark:bg-slate-800 text-left font-medium flex items-center justify-between transition-all outline-none ${
          disabled
            ? "bg-slate-100 dark:bg-slate-800/80 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700"
            : isOpen
              ? "border-brand-500 ring-2 ring-brand-500/20 shadow-xs cursor-pointer"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-xs"
        }`}
      >
        <span className="truncate text-slate-900 dark:text-white flex items-center gap-1.5">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <ChevronDown
          className={`${
            size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
          } text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-brand-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 right-0 ${
            openTop ? "bottom-full mb-1" : "top-full mt-1"
          } z-[99999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
            size === "sm" ? "rounded-xl p-1 shadow-2xl max-h-80" : "rounded-2xl p-1.5 shadow-2xl max-h-80"
          } space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 overflow-y-auto min-w-full`}
        >
          {searchable && (
            <div className="relative p-1 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  if (onSearch) onSearch(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              ) : searchTerm ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    if (onSearch) onSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          )}

          {isSearching && filteredOptions.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
              <span>Searching options...</span>
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected =
                opt.value === value ||
                (Boolean(value) && opt.label?.toLowerCase().trim() === value?.toLowerCase().trim()) ||
                (Array.isArray(selectedValues) && (selectedValues.includes(opt.value) || selectedValues.includes(opt.label)));
              return (
                <button
                  key={`${opt.value || opt.label}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                    if (onSearch) onSearch("");
                  }}
                  className={`w-full ${
                    size === "sm"
                      ? "px-2.5 py-2 rounded-lg text-[11px]"
                      : "px-3 py-2.5 rounded-xl text-xs"
                  } text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  }`}
                >
                  <span className="flex items-center gap-2 text-left leading-tight break-words flex-1">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && (
                    <CheckCircle2 className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} text-purple-600 dark:text-purple-400 shrink-0 ml-1`} />
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              {searchTerm ? `No options found matching "${searchTerm}"` : "No options available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
