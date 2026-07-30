import * as React from "react";
import {
    Animated,
    Pressable,
    StyleProp,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Pressable>, "style"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className,
  style,
  onPress,
  ...props
}: SwitchProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);

  const isChecked = controlledChecked !== undefined ? controlledChecked : uncontrolledChecked;

  // 썸(Thumb)의 X축 이동 애니메이션 값 (0: unchecked, 1: checked)
  const animValue = React.useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animValue, {
      toValue: isChecked ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isChecked, animValue]);

  const handlePress = (e: any) => {
    if (disabled) return;
    onPress?.(e);

    const nextChecked = !isChecked;
    if (controlledChecked === undefined) {
      setUncontrolledChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  };

  // 트랙(32px) 내부에서 16px 썸이 이동하는 거리: 14px
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{
        checked: isChecked,
        disabled,
      }}
      disabled={disabled}
      onPress={handlePress}
      className={cn(
        "w-8 h-5 rounded-full justify-center p-0.5 transition-colors",
        isChecked
          ? "bg-blue-600 dark:bg-blue-500"
          : "bg-gray-200 dark:bg-gray-800",
        disabled && "opacity-50",
        className
      )}
      style={style}
      {...props}
    >
      <Animated.View
        className={cn(
          "h-4 w-4 rounded-full bg-white dark:bg-gray-100 shadow-sm"
        )}
        style={{
          transform: [{ translateX }],
        }}
      />
    </Pressable>
  );
}

export { Switch };
