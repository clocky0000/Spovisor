import * as React from "react";
import {
    LayoutChangeEvent,
    PanResponder,
    StyleProp,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

export interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Slider({
  value: controlledValue,
  defaultValue = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  style,
}: SliderProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<number[]>(defaultValue);
  const [trackWidth, setTrackWidth] = React.useState(0);

  const rawValue = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const currentValue = rawValue[0] ?? min;

  const clampAndStep = React.useCallback(
    (val: number) => {
      const clamped = Math.min(Math.max(val, min), max);
      const stepped = Math.round((clamped - min) / step) * step + min;
      return Number(stepped.toFixed(2));
    },
    [min, max, step]
  );

  const updateValueFromX = React.useCallback(
    (locationX: number) => {
      if (trackWidth <= 0 || disabled) return;
      const percentage = Math.min(Math.max(locationX / trackWidth, 0), 1);
      const newValue = clampAndStep(min + percentage * (max - min));

      if (controlledValue === undefined) {
        setUncontrolledValue([newValue]);
      }
      onValueChange?.([newValue]);
    },
    [trackWidth, disabled, min, max, clampAndStep, controlledValue, onValueChange]
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => {
          updateValueFromX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          updateValueFromX(evt.nativeEvent.locationX);
        },
      }),
    [disabled, updateValueFromX]
  );

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const percentage = Math.min(
    Math.max(((currentValue - min) / (max - min)) * 100, 0),
    100
  );

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{
        min,
        max,
        now: currentValue,
      }}
      accessibilityState={{ disabled }}
      className={cn(
        "relative w-full h-8 justify-center touch-none",
        disabled && "opacity-50",
        className
      )}
      style={style}
      {...panResponder.panHandlers}
      onLayout={handleLayout}
    >
      {/* Background Track */}
      <View className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        {/* Active Range */}
        <View
          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>

      {/* Thumb Handle */}
      <View
        className="absolute h-5 w-5 rounded-full border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-gray-900 shadow-md -ml-2.5"
        style={{ left: `${percentage}%` }}
      />
    </View>
  );
}

export { Slider };
