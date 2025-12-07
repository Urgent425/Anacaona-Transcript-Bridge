//src/components/ui/tabs.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const TabsCtx = createContext(null);

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className = "", children }) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = isControlled ? controlledValue : uncontrolled;

  const setValue = (v) => {
    if (!isControlled) setUncontrolled(v);
    onValueChange?.(v);
  };

  const ctx = useMemo(() => ({ value, setValue }), [value]);

  return (
    <TabsCtx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ className = "", children }) {
  const { value, setValue } = useContext(TabsCtx);
  const listRef = useRef(null);

  // Keyboard navigation among triggers inside this list
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handler = (e) => {
      const triggers = Array.from(
        el.querySelectorAll('[role="tab"]:not([aria-disabled="true"])')
      );
      if (triggers.length === 0) return;

      const currentIndex = triggers.findIndex((btn) => btn.getAttribute("data-value") === String(value));
      const lastIdx = triggers.length - 1;

      const focusIndex = (idx) => {
        const target = triggers[Math.max(0, Math.min(idx, lastIdx))];
        target?.focus();
        const v = target?.getAttribute("data-value");
        if (v) setValue(v);
      };

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          focusIndex(currentIndex === -1 ? 0 : (currentIndex + 1) % triggers.length);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          focusIndex(currentIndex === -1 ? 0 : (currentIndex - 1 + triggers.length) % triggers.length);
          break;
        case "Home":
          e.preventDefault();
          focusIndex(0);
          break;
        case "End":
          e.preventDefault();
          focusIndex(lastIdx);
          break;
        default:
          break;
      }
    };

    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [value, setValue]);

  return (
    <div
      ref={listRef}
      role="tablist"
      className={`inline-flex rounded-lg border bg-white overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, disabled = false, className = "", children }) {
  const { value: active, setValue } = useContext(TabsCtx);
  const isActive = active === value;

  const base =
    "px-4 py-2 text-sm border-r last:border-r-0 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 " +
    "transition";
  const state = disabled
    ? "text-gray-300 cursor-not-allowed bg-white"
    : isActive
    ? "bg-gray-100 font-medium"
    : "hover:bg-gray-50";

  return (
    <button
      role="tab"
      data-value={value}
      aria-selected={isActive}
      aria-disabled={disabled || undefined}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      className={`${base} ${state} ${className}`}
      onClick={() => !disabled && setValue(value)}
      type="button"
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = "", children }) {
  const { value: active } = useContext(TabsCtx);
  const hidden = active !== value;

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      hidden={hidden}
      className={className}
    >
      {!hidden && children}
    </div>
  );
}
