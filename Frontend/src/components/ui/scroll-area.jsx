//src/components/ui/scroll-area.jsx
import React from "react";

export function ScrollArea({ className = "", children, style }) {
  // NOTE: For fancy scrollbars, add a Tailwind plugin or custom CSS.
  return (
    <div
      className={`overflow-auto [-webkit-overflow-scrolling:touch] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
