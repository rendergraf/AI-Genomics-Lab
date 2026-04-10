/**
 * Area Types Module
 * 
 * Defines TypeScript types, interfaces, and CVA (Class Variance Authority)
 * configurations for the Area component.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";

// ============================================
// Area Types - Types and interfaces
// ============================================

/**
 * Area visual style variants.
 * 
 * @typedef {"default"}
 */
export type AreaVariant = "default";

/**
 * Class Variance Authority (CVA) configuration for area styles.
 * Defines base classes and variant-specific styling rules.
 * 
 * @example
 * ```ts
 * const variants = areaVariants({ variant: 'default' })
 * ```
 */
export const areaVariants = cva("p-4 bg-card relative bg-zinc-900/50 shadow-xl", {
  variants: {
    variant: {
      default: "p-4 bg-card relative bg-zinc-900/50 shadow-xl",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// ============================================
// Area Props Interface
// ============================================

/**
 * Props for the Area component.
 * 
 * Extends native HTML div attributes plus CVA variant props.
 * 
 * @interface
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 * @extends {VariantProps<typeof areaVariants>}
 * 
 * @example
 * ```tsx
 * <Area className="mt-4">
 *   <p>Content</p>
 * </Area>
 * ```
 */
export interface AreaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof areaVariants> {}