import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default:
    "bg-blue-600 text-white hover:bg-blue-500 border-transparent",
  destructive:
    "bg-red-600 text-white hover:bg-red-500 border-transparent",
  outline:
    "border border-border bg-background hover:bg-muted text-foreground",
  secondary:
    "bg-muted text-foreground hover:bg-muted/80 border-transparent",
  ghost:
    "bg-transparent hover:bg-muted text-foreground border-transparent",
  link:
    "bg-transparent underline-offset-4 hover:underline text-blue-600 border-transparent p-0 h-auto",
};

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-8",
  icon: "h-10 w-10",
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 border",
          buttonVariants[variant] || buttonVariants.default,
          buttonSizes[size] || buttonSizes.default,
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };