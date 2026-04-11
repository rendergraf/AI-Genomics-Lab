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
}

const sizeStyles = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, selectSize = "md", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full bg-zinc-900/50 transition-colors duration-200 outline-none appearance-none cursor-pointer",
          sizeStyles[selectSize],
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export { Select };