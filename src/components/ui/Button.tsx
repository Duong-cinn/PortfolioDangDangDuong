import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { buttonVariants, type ButtonVariants } from "./buttonVariants";
import { cn } from "@/lib/utils";

type Variants = ButtonVariants;

export const ButtonLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & Variants>(
  ({ className, variant, size, ...props }, ref) => (
    <a ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
ButtonLink.displayName = "ButtonLink";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & Variants>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
