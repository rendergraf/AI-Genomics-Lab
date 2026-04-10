  /**
 * Area Component Module
 *
 * A simple container component that wraps children with card styling.
 *
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type AreaProps, type AreaVariant, areaVariants } from "./Area.types";

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
// Area Component
// ============================================

/**
 * A simple container component that wraps children with card styling.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Area>
 *   <h2>Title</h2>
 *   <p>Content</p>
 * </Area>
 *
 * // With title and variant
 * <Area variant="default" className="mt-4">
 *   <p>Wrapped content</p>
 * </Area>
 * ```
 *
 * @see {@link https://tailwindcss.com| Tailwind CSS} for styling
 */
const Area = React.forwardRef<HTMLDivElement, AreaProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(areaVariants({ variant, className }))}
        {...props}
      >
        <span className="absolute top-px right-px border-t-2 border-r-2 border-gray-500 w-[20px] h-[20px]"/>
        <span className="absolute bottom-px left-px border-b-2 border-l-2 border-gray-500 w-[20px] h-[20px]"/>
        {children}
      </div>
    );
  },
);

Area.displayName = "Area";

export { Area, areaVariants };
export type { AreaProps, AreaVariant };
