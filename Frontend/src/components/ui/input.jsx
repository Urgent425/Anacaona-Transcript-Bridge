//src/components/ui/input.jsx
import React, { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { className = "", type = "text", ...props },
  ref
) {
  const base =
    "w-full border rounded px-3 py-2 text-sm bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-200 " +
    "placeholder:text-gray-400";
  return <input ref={ref} type={type} className={`${base} ${className}`} {...props} />;
});
