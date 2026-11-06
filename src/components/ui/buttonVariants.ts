import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-fast ease-out-expo",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-cyan text-bg hover:-translate-y-px hover:shadow-glow",
        secondary: "border border-ink-3/60 text-ink hover:border-ink-2 hover:bg-elevated",
        ghost: "text-ink-2 hover:text-ink hover:bg-elevated/60",
      },
      size: {
        md: "h-11 px-5 text-sm",
        sm: "h-9 px-3.5 text-sm",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
