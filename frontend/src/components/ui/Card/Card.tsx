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
 * Card hover context - provides hover state to child components
 */
export const CardHoverContext = React.createContext<boolean>(false);

export type CardColorPalette = "brand-blue" | "brand-orange" | "brand-green";

export type Padding = "none" | "sm" | "md" | "lg";

/**
 * Card component props
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant
   * @default "default"
   */
  variant?: "default" | "outline";
  /**
   * Card padding size
   * @default "md"
   */
  padding?: Padding;
  /**
   * Color palette for the card
   * @default "brand-blue"
   */
  colorPalette?: CardColorPalette;
}

/**
 * Card header props
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card title props
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  hovered?: boolean;
}

/**
 * Card description props
 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    padding?: Padding;
}

/**
 * Card content props
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
}

/**
 * Card footer props
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card component - Container with rounded corners and shadow
 * 
 * @example
 * // Default card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description goes here</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Content here</p>
 *   </CardContent>
 * </Card>
 * 
 * @example
 * // Outline card
 * <Card variant="outline">
 *   <CardContent>Content</CardContent>
 * </Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", colorPalette = "brand-blue", ...props }, ref) => {
    const paddingStyles = {
      none: "",
      sm: "pr-4 pb-4 pt-0",
      md: "pr-9 pb-9 pt-0",
      lg: "pr-8 pb-8 pt-0",
    };

    const paletteColors: Record<CardColorPalette, { fill: string; hover: string; border: string }> = {
      "brand-blue": { fill: "#17181a", hover: "#1c1e20", border: "#457AED" },
      "brand-orange": { fill: "#E28D50", hover: "#020202", border: "#C46F32" },
      "brand-green": { fill: "#86F99B", hover: "#6FE684", border: "#3AA14F" },
    };

    const colors = paletteColors[colorPalette];
    const [hovered, setHovered] = React.useState(false);

    return (
      <div
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative overflow-visible text-shadow-md hover:text-shadow-lg w-full max-w-lg md:max-w-2xl lg:max-w-2xl",
          paddingStyles[padding],
          className
        )}
      >
        <span className="absolute -bottom-px -left-px bg-gray-500 w-[20px] h-[20px]"/>

        <span
          className="absolute w-full h-full top-0 left-0 bg-noise bg-[size:1000px_1000px,100px_100px] bg-[#0f0f0f]"
          style={{
            backgroundColor: hovered ? colors.hover : colors.fill,
            clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)',
          }}
        />


        {/* Contenido */}
        <CardHoverContext.Provider value={hovered}>
          <div className="relative z-10">
            {props.children}
          </div>
        </CardHoverContext.Provider>
      </div>
    );
  }
);
Card.displayName = "Card";

/**
 * Card header - Contains title and description
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

/**
 * Card title - Heading element
 */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    const hovered = React.useContext(CardHoverContext);

    return (
      <div
        className={cn("relative")}
      >
        <span className="absolute -top-px -left-px bg-gray-500 w-[20px] h-[20px]"/>
        <span className="absolute h-full top-0 left-0"
          style={{
            backgroundColor: hovered ? '#1f2124' : '#1c1e20',
            clipPath: 'polygon(0 0, 100% 0, 100% 60%, 97% 100%, 0 100%)',
            width: '100%',
          }}
        />
        <h3
          ref={ref}
          className={cn(
            "relative z-10 text-lg font-electrolize font-semibold uppercase leading-none tracking-tight text-gray-100 px-6 py-4",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CardTitle.displayName = "CardTitle";

/**
 * Card description - Secondary text
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, padding = "md", ...props }, ref) => {
    const paddingStyles = {
      none: "",
      sm: "pl-4",
      md: "pl-6",
      lg: "pl-8",
    };

    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-100 pt-4", paddingStyles[padding], className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = "CardDescription";

/**
 * Card content - Main body
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = "md", ...props }, ref) => {
    const paddingStyles = {
      none: "",
      sm: "pl-4",
      md: "pl-6",
      lg: "pl-8",
    };

    return (
      <div
        ref={ref}
        className={cn(paddingStyles[padding], className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

/**
 * Card footer - Bottom section for actions
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end pt-8", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
