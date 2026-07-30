import * as React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { cn } from "./utils";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  value?: number; // 0 ~ 100
  max?: number;
  className?: string;
  indicatorClassName?: string;
  style?: StyleProp<ViewStyle>;
}

const Progress = React.forwardRef<View, ProgressProps>(
  (
    {
      className,
      indicatorClassName,
      value = 0,
      max = 100,
      style,
      ...props
    },
    ref
  ) => {
    // 0~100 범위로 수치 정규화 (Percentage)
    const percentage = Math.min(
      Math.max(0, ((value ?? 0) / max) * 100),
      100
    );

    return (
      <View
        ref={ref}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max,
          now: value ?? 0,
        }}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/50",
          className
        )}
        style={style}
        {...props}
      >
        <View
          className={cn(
            "h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all",
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </View>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
