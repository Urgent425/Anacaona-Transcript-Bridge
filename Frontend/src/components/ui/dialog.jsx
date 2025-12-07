// src/components/ui/dialog.jsx
import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

// Root & Trigger
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

// Portal + Overlay
export const DialogPortal = ({ children }) => (
  <RadixDialog.Portal>
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
      {children}
    </div>
  </RadixDialog.Portal>
);

export const DialogOverlay = (props) => (
  <RadixDialog.Overlay
    className="fixed inset-0 bg-black/50"
    {...props}
  />
);

// Content
export const DialogContent = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        ref={ref}
        className={`
          fixed z-50 grid w-full gap-4 bg-white p-6 shadow-lg outline-none
          sm:max-w-lg sm:rounded-lg
          ${className}
        `}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = "DialogContent";

// Header & Footer
export const DialogHeader = ({ children, className = "", ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const DialogFooter = ({ children, className = "", ...props }) => (
  <div
    className={`flex flex-row-reverse items-center space-x-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Title
export const DialogTitle = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <RadixDialog.Title
      ref={ref}
      className={`text-lg font-semibold tracking-tight ${className}`}
      {...props}
    >
      {children}
    </RadixDialog.Title>
  )
);
DialogTitle.displayName = "DialogTitle";
