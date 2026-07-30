import * as React from "react";
import { StyleProp, TextInput, TextStyle } from "react-native";
import { cn } from "./utils";

export interface TextareaProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  className?: string;
  style?: StyleProp<TextStyle>;
}

function Textarea({
  className,
  style,
  placeholderTextColor,
  multiline = true,
  numberOfLines = 4,
  ...props
}: TextareaProps) {
  return (
    <TextInput
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      placeholderTextColor={placeholderTextColor ?? "#9CA3AF"}
      className={cn(
        "min-h-[96px] w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-base dark:text-gray-100 transition-colors focus:border-blue-600 dark:focus:border-blue-500 disabled:opacity-50",
        className
      )}
      style={style}
      {...props}
    />
  );
}

export { Textarea };
