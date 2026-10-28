"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { Portal } from "@/components/Portal";

export interface StatusDropdownProps {
  status: "Active" | "Inactive" | string;
  isUpdating?: boolean;
  disabled?: boolean;
  onChange: (newStatus: "Active" | "Inactive") => void | Promise<void>;
  className?: string;
  title?: string;
  size?: "sm" | "xs";
}

export function StatusDropdown({
  status,
  isUpdating = false,
  disabled = false,
  onChange,
  className = "",
  title = "Change status",
  size = "sm",
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = status === "Active";

  const updateCoords = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 110 && spaceAbove > 110) {
      setCoords({ bottom: window.innerHeight - rect.top + 6, left: Math.max(8, rect.left) });
    } else {
      setCoords({ top: rect.bottom + 6, left: Math.max(8, rect.left) });
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUpdating) return;
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updateCoords();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (choice: "Active" | "Inactive", e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (choice !== status) {
      onChange(choice);
    }
  };

  const sizeClasses =
    size === "xs"
      ? "text-[10px] px-2 py-0.5"
      : "text-[11px] px-2.5 py-1";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || isUpdating}
        onClick={toggleDropdown}
        title={title}
        className={`rounded-full font-medium border transition-all flex items-center gap-1.5 outline-none shadow-2xs hover:shadow-xs cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses} ${
          isActive
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950"
            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${
            isActive ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-slate-400"
          }`}
        />
        <span>{isActive ? "Active" : "Inactive"}</span>
        <span className="shrink-0 text-current opacity-70">
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </span>
      </button>

      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: `${coords.left}px`,
              top: coords.top !== undefined ? `${coords.top}px` : "auto",
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
            }}
            className="z-[999999] min-w-[130px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={(e) => handleSelect("Active", e)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Active</span>
              </div>
              {isActive && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />}
            </button>

            <button
              type="button"
              onClick={(e) => handleSelect("Inactive", e)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                !isActive
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Inactive</span>
              </div>
              {!isActive && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 stroke-[2.5]" />}
            </button>
          </div>
        </Portal>
      )}
    </div>
  );
}
