import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

/**
 * Utility function to merge Tailwind CSS classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Alert types
 */
export type AlertVariant = "info" | "warning" | "success" | "error";

/**
 * Alert component props
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alert variant/type
   * @default "info"
   */
  variant?: AlertVariant;
  /**
   * If true, shows an icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom icon to replace default
   */
  icon?: React.ReactNode;
}

/**
 * Alert title props
 */
export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * Alert description props
 */
export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Get alert styles based on variant
 */
const getAlertStyles = (variant: AlertVariant) => {
  const styles = {
    info: {
      container: "bg-brand-blue-100 text-brand-blue-700",
      icon: "text-brand-blue-500",
      title: "text-brand-blue-800",
    },
    warning: {
      container: "bg-brand-orange-100 text-brand-orange-700",
      icon: "text-brand-orange-500",
      title: "text-brand-orange-800",
    },
    success: {
      container: "bg-brand-green-100 text-brand-green-700",
      icon: "text-brand-green-500",
      title: "text-brand-green-800",
    },
    error: {
      container: "bg-red-100 text-red-700",
      icon: "text-red-500",
      title: "text-red-800",
    },
  };
  return styles[variant];
};

/**
 * Get default icon based on variant
 */
const getDefaultIcon = (variant: AlertVariant) => {
  const icons = {
    info: <Info className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
  };
  return icons[variant];
};

/**
 * Alert component - Displays a callout for user attention
 * 
 * @example
 * // Info alert
 * <Alert>
 *   <AlertTitle>Information</AlertTitle>
 *   <AlertDescription>This is an informational message</AlertDescription>
 * </Alert>
 * 
 * @example
 * // Warning alert
 * <Alert variant="warning">
 *   <AlertTitle>Warning</AlertTitle>
 *   <AlertDescription>Please review your input</AlertDescription>
 * </Alert>
 * 
 * @example
 * // Success alert
 * <Alert variant="success">
 *   <AlertDescription>Operation completed successfully</AlertDescription>
 * </Alert>
 * 
 * @example
 * // Error alert
 * <Alert variant="error">
 *   <AlertTitle>Error</AlertTitle>
 *   <AlertDescription>Something went wrong</AlertDescription>
 * </Alert>
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", showIcon = true, icon, children, ...props }, ref) => {
    const styles = getAlertStyles(variant);

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-4 flex gap-3",
          styles.container,
          className
        )}
        role="alert"
        {...props}
      >
        {showIcon && (
          <div className={cn("flex-shrink-0", styles.icon)}>
            {icon || getDefaultIcon(variant)}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

/**
 * Alert title - Bold heading
 */
const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn("font-semibold text-sm", className)}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

/**
 * Alert description - Supporting text
 */
const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm mt-1", className)}
      {...props}
    />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
