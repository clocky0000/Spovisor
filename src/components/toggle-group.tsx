import * as React from "react";
import {
    Pressable,
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

type ToggleType = "single" | "multiple";

interface ToggleGroupContextValue {
  type?: ToggleType;
  value?: string | string[];
  onValueChange?: (value: any) => void;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  type: "single",
  variant: "default",
  size: "default",
});

/* -------------------------------------------------------------------------- */
/* ToggleGroup Root                                                           */
/* -------------------------------------------------------------------------- */

export interface ToggleGroupProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  type?: ToggleType;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: any) => void;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function ToggleGroup({
  type = "single",
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = "default",
  size = "default",
  disabled = false,
  className,
  style,
  children,
  ...props
}: ToggleGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | string[]
  >(defaultValue ?? (type === "multiple" ? [] : ""));

  const currentValue =
    controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleItemPress = React.useCallback(
    (itemValue: string) => {
      if (disabled) return;

      if (type === "single") {
        const nextValue = currentValue === itemValue ? "" : itemValue;
        if (controlledValue === undefined) {
          setUncontrolledValue(nextValue);
        }
        onValueChange?.(nextValue);
      } else {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        const nextArray = currentArray.includes(itemValue)
          ? currentArray.filter((v) => v !== itemValue)
          : [...currentArray, itemValue];

        if (controlledValue === undefined) {
          setUncontrolledValue(nextArray);
        }
        onValueChange?.(nextArray);
      }
    },
    [type, currentValue, controlledValue, disabled, onValueChange]
  );

  return (
    <ToggleGroupContext.Provider
      value={{
        type,
        value: currentValue,
        onValueChange: handleItemPress,
        variant,
        size,
        disabled,
      }}
    >
      <View
        className={cn(
          "flex-row items-center justify-center rounded-md",
          variant === "outline" && "border border-gray-200 dark:border-gray-800",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </View>
    </ToggleGroupContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* ToggleGroupItem                                                            */
/* -------------------------------------------------------------------------- */

export interface ToggleGroupItemProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Pressable>, "style"> {
  value: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function ToggleGroupItem({
  value: itemValue,
  variant: itemVariant,
  size: itemSize,
  disabled: itemDisabled,
  className,
  textClassName,
  style,
  textStyle,
  children,
  onPress,
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);

  const variant = itemVariant || context.variant || "default";
  const size = itemSize || context.size || "default";
  const disabled = itemDisabled ?? context.disabled ?? false;

  const isPressed = Array.isArray(context.value)
    ? context.value.includes(itemValue)
    : context.value === itemValue;

  const handlePress = (e: any) => {
    if (disabled) return;
    onPress?.(e);
    context.onValueChange?.(itemValue);
  };

  // 크기 패딩 지정
  const sizeClasses = {
    sm: "h-8 px-2.5",
    default: "h-9 px-3",
    lg: "h-10 px-3.5",
  }[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isPressed, disabled }}
      disabled={disabled}
      onPress={handlePress}
      className={cn(
        "flex-row items-center justify-center transition-colors",
        sizeClasses,
        // Default Variant Style
        variant === "default" &&
          (isPressed
            ? "bg-gray-200 dark:bg-gray-800"
            : "bg-transparent"),
        // Outline Variant Style
        variant === "outline" &&
          (isPressed
            ? "bg-gray-200 dark:bg-gray-800"
            : "bg-transparent"),
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

export { ToggleGroup, ToggleGroupItem };
