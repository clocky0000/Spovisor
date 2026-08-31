import * as React from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { cn } from "./utils";

export interface SkeletonProps
  extends React.ComponentPropsWithoutRef<typeof Animated.View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Skeleton({ className, style, ...props }: SkeletonProps) {
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="loading"
      className={cn(
        "bg-gray-200 dark:bg-gray-800 rounded-md",
        className
      )}
      style={[{ opacity: pulseAnim }, style]}
      {...props}
    />
  );
}

export { Skeleton };
