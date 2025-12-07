// src/components/ui/select.jsx
import React from "react";
import * as Radix from "@radix-ui/react-select";

export const Select = Radix.Root;
export const SelectTrigger = React.forwardRef(({ children, className, ...props }, ref) => (
  <Radix.Trigger ref={ref} className={`w-full border rounded px-2 py-1 ${className}`} {...props}>
    {children}
  </Radix.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = Radix.Value;

export const SelectContent = React.forwardRef(({ children, className, ...props }, ref) => (
  <Radix.Portal>
    <Radix.Content
      ref={ref}
      className={`bg-white border rounded shadow-md ${className}`}
      {...props}
    >
      <Radix.Viewport>{children}</Radix.Viewport>
    </Radix.Content>
  </Radix.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef(({ children, className, value, ...props }, ref) => (
  <Radix.Item ref={ref} value={value} className={`px-2 py-1 hover:bg-gray-100 ${className}`} {...props}>
    <Radix.ItemText>{children}</Radix.ItemText>
  </Radix.Item>
));
SelectItem.displayName = "SelectItem";
