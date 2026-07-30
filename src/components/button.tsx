import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import {
    Pressable,
    PressableProps,
    StyleProp,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";

import { cn } from "./utils";

// --- Button Container Variants ---
const buttonVariants = cva(
  "inline-flex flex-row items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all active:opacity-80 disabled:opacity-50 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gray-900 dark:bg-gray-100 active:bg-gray-800 dark:active:bg-gray-200",
        destructive:
          "bg-red-500 dark:bg-red-600 active:bg-red-600 dark:active:bg-red-700",
        outline:
          "border border-gray-200 dark:border-gray-800 bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
        secondary:
          "bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700",
        ghost:
          "bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
        link: "bg-transparent p-0",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3 py-1.5 gap-1.5",
        lg: "h-12 rounded-xl px-6 py-3",
        icon: "h-11 w-11 rounded-xl items-center justify-center p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// --- Button Text Variants ---
const buttonTextVariants = cva("text-sm font-semibold", {
  variants: {
    variant: {
      default: "text-white dark:text-gray-900",
      destructive: "text-white",
      outline: "text-gray-900 dark:text-gray-100",
      secondary: "text-gray-900 dark:text-gray-100",
      ghost: "text-gray-900 dark:text-gray-100",
      link: "text-gray-900 dark:text-gray-100 underline",
    },
    size: {
      default: "text-sm",
      sm: "text-xs",
      lg: "text-base",
      icon: "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends Omit<PressableProps, "style">,
    VariantProps<typeof buttonVariants> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

function Button({
  className,
  variant,
  size,
  textClassName,
  textStyle,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      className={cn(
        buttonVariants({ variant, size }),
        disabled && "opacity-50",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn(
            buttonTextVariants({ variant, size }),
            textClassName
          )}
          style={textStyle}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { Button, buttonTextVariants, buttonVariants };
