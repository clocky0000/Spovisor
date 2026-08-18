import * as React from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import { cn } from "./utils";

export interface LabelProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Text>, "style"> {
  className?: string;
  style?: StyleProp<TextStyle>;
  disabled?: boolean;
  children?: React.ReactNode;
}

const Label = React.forwardRef<Text, LabelProps>(
  ({ className, disabled = false, style, children, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        accessibilityRole="text"
        aria-disabled={disabled}
        className={cn(
          "text-sm font-medium text-gray-900 dark:text-gray-100 leading-none select-none",
          disabled && "opacity-50",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

Label.displayName = "Label";

export { Label };
