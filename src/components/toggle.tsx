import * as React from "react";
import {
    Pressable,
    StyleProp,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

export interface ToggleProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Pressable>, "style"> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function Toggle({
  pressed: controlledPressed,
  defaultPressed = false,
  onPressedChange,
  variant = "default",
  size = "default",
  disabled = false,
  className,
  textClassName,
  style,
  textStyle,
  children,
  onPress,
  ...props
}: ToggleProps) {
  const [uncontrolledPressed, setUncontrolledPressed] = React.useState(defaultPressed);

  const isPressed =
    controlledPressed !== undefined ? controlledPressed : uncontrolledPressed;

  const handlePress = (e: any) => {
    if (disabled) return;
    onPress?.(e);

    const nextPressed = !isPressed;
    if (controlledPressed === undefined) {
      setUncontrolledPressed(nextPressed);
    }
    onPressedChange?.(nextPressed);
  };

  // 크기 패딩 및 최소 높이
  const sizeClasses = {
    sm: "h-8 px-2 min-w-8",
    default: "h-9 px-2.5 min-w-9",
    lg: "h-10 px-3 min-w-10",
  }[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isPressed, disabled }}
      disabled={disabled}
      onPress={handlePress}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md transition-colors",
        sizeClasses,
        // Default Variant
        variant === "default" &&
          (isPressed
            ? "bg-gray-200 dark:bg-gray-800"
            : "bg-transparent"),
        // Outline Variant
        variant === "outline" &&
          (isPressed
            ? "bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            : "border border-gray-200 dark:border-gray-800 bg-transparent"),
        disabled && "opacity-50",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn(
            "text-sm font-medium",
            isPressed
              ? "text-gray-900 dark:text-gray-100 font-semibold"
              : "text-gray-600 dark:text-gray-400",
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

export { Toggle };
