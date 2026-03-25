/**
 * Button Component Module
 * 
 * A highly customizable button component with support for multiple variants,
 * sizes, color schemes, and loading states. Built with accessibility and
 * theming in mind.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  buttonVariants,
  type ButtonColorScheme,
  type ButtonSize,
  type ButtonVariant,
  type ButtonProps,
  type SpinnerPlacement,
} from "./Button.types";
import {
  borderLayer,
  containerLayer,
  textLayer,
  spinnerSizeMap,
} from "./Button.tokens";

/**
 * Utility function that merges class names using clsx and tailwind-merge.
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 * 
 * @example
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-blue-500")
 * ```
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Button Component
// ============================================

/**
 * A versatile button component with multiple visual variants, sizes, and states.
 * 
 * Supports three visual styles (solid, outline, ghost), five color schemes,
 * and includes built-in loading state with optional spinner.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * // With variant and size
 * <Button variant="outline" size="lg">Submit</Button>
 * 
 * // Loading state
 * <Button loading loadingText="Saving...">Save</Button>
 * 
 * // As child component
 * <Button asChild><a href="/">Go Home</a></Button>
 * ```
 * 
 * @see {@link https://tailwindcss.com| Tailwind CSS} for styling
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "solid",
      size = "xl",
      colorScheme = "primary",
      spinnerPlacement = "start",
      loading = false,
      loadingText,
      spinner,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    const spinnerSize = spinnerSizeMap[size ?? "md"];

    // Tailwind classes for the layers (with group-hover)
    const borderLayerClass = borderLayer[colorScheme ?? "primary"][variant ?? "solid"];
    const containerLayerClass = containerLayer[colorScheme ?? "primary"][variant ?? "solid"];
    const textLayerClass = textLayer[colorScheme ?? "primary"][variant ?? "solid"];

    // When asChild, render the child with text styling
    if (asChild) {
      // Get border layer for asChild (use solid style)
      const asChildBorderClass = borderLayer[colorScheme ?? "primary"].solid;
      const asChildContainerClass = containerLayer[colorScheme ?? "primary"].solid;
      
      return (
        <Comp
          ref={ref}
          className={cn(
            "group",
            buttonVariants({ variant, size, colorScheme: colorScheme ?? "primary", className })
          )}
          {...props}
        >
          {/* Border layer for asChild */}
          <span
            className={cn("absolute w-full h-full top-px right-px [clip-path:url(#btnClip)]", asChildBorderClass)}
          />
          {/* Container layer for asChild */}
          <span
            className={cn("absolute inset-0 [clip-path:url(#btnClip)]", asChildContainerClass)}
          />
          {/* Text */}
          <span className={cn("relative z-10", textLayerClass)}>
            {children}
          </span>
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        type={asChild ? undefined : props.type ?? "button"}
        data-loading={loading}
        data-variant={variant}
        data-size={size}
        className={cn(
          "group", // Add group for hover functionality
          buttonVariants({ variant, size, colorScheme: colorScheme ?? "primary", className })
        )}
        {...props}
      >
        {/* Spinner Start */}
        {loading && spinnerPlacement === "start" && (
          <span className={cn("mr-2 inline-flex z-10 relative", spinnerSize)}>
            {spinner || <Loader2 className="animate-spin" />}
          </span>
        )}

        {/* Border layer */}
        <span
          className={cn("absolute w-full h-full top-px right-px [clip-path:url(#btnClip)]", borderLayerClass)}
        />

        {/* Main container layer */}
        <span
          className={cn("absolute inset-0 [clip-path:url(#btnClip)]", containerLayerClass)}
        />

        {/* Text */}
        <span className={cn("relative z-10", textLayerClass)}>
          {loading && loadingText ? loadingText : children}
        </span>

        {/* Spinner End */}
        {loading && spinnerPlacement === "end" && (
          <span className={cn("ml-2 inline-flex z-10 relative", spinnerSize)}>
            {spinner || <Loader2 className="animate-spin" />}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps, ButtonSize, ButtonVariant, ButtonColorScheme, SpinnerPlacement };
