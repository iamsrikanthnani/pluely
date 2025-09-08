"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  style,
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const resolvedStyle: React.CSSProperties | undefined = {
    // If the popover trigger feature is enabled, consume the CSS variable managed by context/hook
    // Fallback to no transparency
    backgroundColor: "var(--popover-trigger-bg, initial)",
    backdropFilter: "var(--popover-trigger-blur, none)",
    color: "var(--popover-trigger-icon-color, inherit)",
    ...style,
  };

  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      {...props}
      style={resolvedStyle}
      className={cn(
        className,
        "transition-all duration-300",
        "data-[state=open]:text-primary data-[state=open]:border-primary/20 data-[state=open]:border-1"
      )}
    />
  );
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "mt-1 shadow-none bg-popover/90 backdrop-blur-3xl text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-xl border p-4 outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
