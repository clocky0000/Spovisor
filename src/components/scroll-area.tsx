import * as React from "react";
import { ScrollView, StyleProp, ViewStyle } from "react-native";
import { cn } from "./utils";

export interface ScrollAreaProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ScrollView>, "style"> {
  orientation?: "vertical" | "horizontal" | "both";
  showScrollBar?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const ScrollArea = React.forwardRef<ScrollView, ScrollAreaProps>(
  (
    {
      className,
      children,
      orientation = "vertical",
      showScrollBar = true,
      style,
      contentContainerStyle,
      ...props
    },
    ref
  ) => {
    const isHorizontal = orientation === "horizontal";

    return (
      <ScrollView
        ref={ref}
        horizontal={isHorizontal}
        showsVerticalScrollIndicator={showScrollBar && !isHorizontal}
        showsHorizontalScrollIndicator={showScrollBar && isHorizontal}
        className={cn("flex-1", className)}
        style={style}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

// 하위 호환성을 위한 패스스루 ScrollBar 컴포넌트
function ScrollBar() {
  return null;
}

export { ScrollArea, ScrollBar };
