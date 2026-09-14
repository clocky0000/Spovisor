import * as React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { cn } from "./utils";

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  style,
  ...props
}: SeparatorProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <View
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : `${orientation} separator`}
      className={cn(
        "bg-gray-200 dark:bg-gray-800 shrink-0",
        isHorizontal ? "h-px w-full" : "h-full w-px",
        className
      )}
      style={style}
      {...props}
    />
  );
}

export { Separator };
