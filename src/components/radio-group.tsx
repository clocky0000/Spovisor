import { Circle } from "lucide-react-native";
import * as React from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import { cn } from "./utils";

// --- Context ---
type RadioGroupContextProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = React.createContext<RadioGroupContextProps | null>(null);

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within a <RadioGroup />");
  }
  return context;
}

// --- RadioGroup Root ---
export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function RadioGroup({
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  children,
  style,
  ...props
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <RadioGroupContext.Provider
      value={{ value, onValueChange: handleValueChange, disabled }}
    >
      <View
        accessibilityRole="radiogroup"
        className={cn("gap-3", className)}
        style={style}
        {...props}
      >
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
}

// --- RadioGroup Item ---
export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  value: string;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  RadioGroupItemProps
>(({ value, disabled: itemDisabled = false, className, style, onPress, ...props }, ref) => {
  const context = useRadioGroup();
  const isChecked = context.value === value;
  const isDisabled = context.disabled || itemDisabled;

  const handlePress = (e: any) => {
    if (isDisabled) return;
    onPress?.(e);
    context.onValueChange?.(value);
  };

  return (
    <Pressable
      ref={ref}
      accessibilityRole="radio"
      accessibilityState={{
        checked: isChecked,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      onPress={handlePress}
      className={cn(
        "h-5 w-5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 items-center justify-center transition-all",
        isChecked && "border-blue-600 dark:border-blue-500",
        isDisabled && "opacity-50",
        className
      )}
      style={style}
      {...props}
    >
      {isChecked && (
        <Circle
          size={10}
          className="fill-blue-600 dark:fill-blue-500 text-blue-600 dark:text-blue-500"
        />
      )}
    </Pressable>
  );
});

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem, useRadioGroup };
