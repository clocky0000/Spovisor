import * as React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { cn } from "./utils";

interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof View> {
  ratio?: number; // 예: 16 / 9, 4 / 3, 1 (기본값: 1)
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function AspectRatio({
  ratio = 1,
  className,
  style,
  children,
  ...props
}: AspectRatioProps) {
  return (
    <View
      className={cn("w-full overflow-hidden", className)}
      style={[{ aspectRatio: ratio }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

export { AspectRatio };
