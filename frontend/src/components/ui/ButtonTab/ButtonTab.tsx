/**
 * ButtonTab Component Module
 * 
 * A tab navigation component with icon and label support.
 * Used for navigation between different sections of the application.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  buttonTabVariants,
  type ButtonTabProps,
} from "./ButtonTab.types";

/**
 * Utility function to merge Tailwind CSS classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// ButtonTab Component
// ============================================

/**
 * ButtonTab component - A tab navigation button with icon and label
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ButtonTab label="Dashboard" icon={Activity} isActive={true} onClick={handleClick} />
 * 
 * // Without icon
 * <ButtonTab label="Settings" isActive={false} onClick={handleClick} />
 * 
 * // Custom size
 * <ButtonTab label="Dashboard" icon={Activity} size="lg" onClick={handleClick} />
 * ```
 */
const ButtonTab = React.forwardRef<HTMLButtonElement, ButtonTabProps>(
  (
    {
      className,
      icon: Icon,
      label,
      isActive = false,
      size = "default",
      variant: variantProp,
      ...props
    },
    ref
  ) => {
    // Determine variant based on isActive state
    const variant = isActive ? "active" : "default";

    return (
      <button
        ref={ref}
        className={cn(
          buttonTabVariants({ variant, size, className })
        )}
        {...props}
        style={{
            clipPath: 'polygon(0 30%, 10% 0, 100% 0, 100% 100%, 0 100%)',
            width: '100%',
          }}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </button>
    );
  }
);

ButtonTab.displayName = "ButtonTab";

export { ButtonTab, buttonTabVariants };
export type { ButtonTabProps };