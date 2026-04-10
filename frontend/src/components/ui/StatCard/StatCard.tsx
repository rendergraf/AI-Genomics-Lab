/**
 * StatCard Component Module
 * 
 * A display component for showing statistics with an icon, label, and value.
 * Supports loading states and formatting of numeric values.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  statCardVariants,
  type StatCardProps,
} from "./StatCard.types";

/**
 * Utility function to merge Tailwind CSS classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// StatCard Component
// ============================================

/**
 * Icon size classes mapping
 */
const iconSizeClasses: Record<string, string> = {
  sm: "h-6 w-6",
  default: "h-8 w-8",
  lg: "h-10 w-10",
};

/**
 * StatCard component - Displays a statistic with icon, label, and value
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <StatCard icon={Dna} label="Samples" value={1250} />
 * 
 * // With loading state
 * <StatCard icon={Dna} label="Samples" value={1250} isLoading={true} />
 * 
 * // Custom icon size
 * <StatCard icon={Dna} label="Samples" value={1250} iconSize="lg" />
 * ```
 */
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      icon: Icon,
      label,
      value,
      isLoading = false,
      iconSize = "default",
      ...props
    },
    ref
  ) => {
    const effectiveIconSize = iconSize ?? "default";
    const iconSizeClass = iconSizeClasses[effectiveIconSize] || iconSizeClasses.default;

    return (
      <div
        ref={ref}
        className={cn("relative overflow-visible",statCardVariants({ iconSize: effectiveIconSize }), className)}
        {...props}
        style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 67%, 92% 100%, 0 100%)',
            width: '100%',
          }}
      >

        <div className="flex items-center gap-4">
          <Icon className={cn("text-primary", iconSizeClass)} />
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            )}
          </div>
        </div>
        <span className="absolute top-px right-px border-t-2 border-r-2 border-gray-500 w-[20px] h-[20px]"/>
        <span className="absolute bottom-px left-px border-b-2 border-l-2 border-gray-500 w-[20px] h-[20px]"/>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard, statCardVariants };
export type { StatCardProps };