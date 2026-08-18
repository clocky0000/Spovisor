import { Check } from "lucide-react-native";
import * as React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import { cn } from "./utils";

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Checkbox({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className,
  style,
  ...props
}: CheckboxProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);

  const isChecked = checkedProp !== undefined ? checkedProp : uncontrolledChecked;

  const handlePress = () => {
    if (disabled) return;
    const nextState = !isChecked;
    if (checkedProp === undefined) {
      setUncontrolledChecked(nextState);
    }
    onCheckedChange?.(nextState);
  };

  return (
    <Pressable
      role="checkbox"
      aria-checked={isChecked}
      accessibilityState={{ checked: isChecked, disabled }}
      disabled={disabled}
      onPress={handlePress}
      className={cn(
        "h-5 w-5 shrink-0 rounded-md border items-center justify-center transition-all active:opacity-80",
        isChecked
          ? "bg-gray-900 border-gray-900 dark:bg-gray-100 dark:border-gray-100"
          : "bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-700",
        disabled && "opacity-50",
        className
      )}
      style={style}
      {...props}
    >
      {isChecked && (
        <Check
          size={14}
          strokeWidth={3}
          className="text-white dark:text-gray-900"
        />
      )}
    </Pressable>
  );
}

export { Checkbox };
