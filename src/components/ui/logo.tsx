import React from "react";
import { cn } from "@/lib/utils";
import bpGroupLogoBlack from "@/assets/bp-group-logo-black.png";
import bpGroupLogoWhite from "@/assets/bp-group-logo-white.png";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "black" | "white";
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", variant = "white", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8",
      md: "h-12", 
      lg: "h-16"
    };

    const logoSrc = variant === "white" ? bpGroupLogoWhite : bpGroupLogoBlack;

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <img 
          src={logoSrc}
          alt="BP Group Logo" 
          className={cn("object-contain", sizeClasses[size])}
        />
      </div>
    );
  }
);

Logo.displayName = "Logo";

export { Logo };