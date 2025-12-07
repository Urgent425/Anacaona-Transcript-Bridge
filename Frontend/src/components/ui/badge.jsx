//src/components/ui/badge.jsx
import React from "react";

const VARIANTS = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger:  "bg-rose-100 text-rose-800",
  info:    "bg-sky-100 text-sky-800",
};

export function Badge({ children, className = "", variant = "default", ...props }) {
  const styles =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const palette = VARIANTS[variant] || VARIANTS.default;

  return (
    <span className={`${styles} ${palette} ${className}`} {...props}>
      {children}
    </span>
  );
}
