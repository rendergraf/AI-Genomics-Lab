import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: "sm" | "md" | "lg";
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

const sizeStyles = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    selectSize = "md", 
    label,
    placeholder,
    error,
    helperText,
    options,
    children,
    ...props 
  }, ref) => {
    const selectId = React.useId();
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;
    const ariaDescribedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const renderOptions = () => {
      if (options) {
        return (
          <>
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </>
        );
      }
      return children;
    };

    const selectElement = (
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "w-full bg-zinc-900/50 border border-zinc-700 rounded-md transition-colors duration-200 outline-none appearance-none cursor-pointer",
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "focus:border-blue-500 focus:ring-blue-500",
          sizeStyles[selectSize],
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {renderOptions()}
      </select>
    );

    const hasWrapper = label || error || helperText;
    
    if (!hasWrapper) {
      return selectElement;
    }

    return (
      <div className="w-full space-y-1">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        {selectElement}
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-500"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={helperId}
            className="text-sm text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };