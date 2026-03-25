import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input variant
   * @default "default"
   */
  variant?: "default" | "error";
  /**
   * Input size
   * @default "md"
   */
  inputSize?: "sm" | "md" | "lg";
  /**
   * If true, shows a success state
   */
  success?: boolean;
  /**
   * Error message to display
   */
  error?: string;
}

/**
 * Input component - Text input field with brand styling
 * 
 * @example
 * // Default input
 * <Input placeholder="Enter text..." />
 * 
 * @example
 * // With label
 * <div className="space-y-2">
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" type="email" placeholder="email@example.com" />
 * </div>
 * 
 * @example
 * // Error state
 * <Input error="This field is required" />
 * 
 * @example
 * // Success state
 * <Input success placeholder="Valid input" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant = "default", 
    inputSize = "md",
    success = false,
    error,
    disabled,
    ...props 
  }, ref) => {
    const sizeStyles = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-4 text-base",
    };

    const size = inputSize;

    const variantStyles = {
      default: "border-gray-300 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-300",
      error: "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-300",
    };

    const stateStyles = success 
      ? "border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-300"
      : "";

    return (
      <div className="w-full">
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl outline-none transition-all duration-200",
            "placeholder:text-gray-400",
            "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
            sizeStyles[size],
            variantStyles[variant],
            stateStyles,
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
