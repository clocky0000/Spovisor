import * as React from "react";
import {
    NativeSyntheticEvent,
    StyleProp,
    TargetedEvent,
    TextInput,
    TextStyle
} from "react-native";
import { cn } from "./utils";

export interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TextInput>, "style"> {
  className?: string;
  style?: StyleProp<TextStyle>;
  type?: "text" | "password" | "email" | "number" | "phone";
  error?: boolean;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      type = "text",
      editable = true,
      error = false,
      onFocus,
      onBlur,
      placeholderTextColor,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);

    // type 속성을 React Native 입력 관련 Props로 매핑
    const getKeyboardProps = () => {
      switch (type) {
        case "password":
          return { secureTextEntry: true, autoCapitalize: "none" as const };
        case "email":
          return {
            keyboardType: "email-address" as const,
            autoCapitalize: "none" as const,
            autoCorrect: false,
          };
        case "number":
          return { keyboardType: "numeric" as const };
        case "phone":
          return { keyboardType: "phone-pad" as const };
        default:
          return {};
      }
    };

    const handleFocus = (e: NativeSyntheticEvent<TargetedEvent>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: NativeSyntheticEvent<TargetedEvent>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <TextInput
        ref={ref}
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={
          placeholderTextColor ?? "rgb(156 163 175)" // gray-400
        }
        className={cn(
          "h-11 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 text-base text-gray-900 dark:text-gray-100 transition-all",
          isFocused && "border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20",
          error && "border-red-500 dark:border-red-400 ring-2 ring-red-500/20",
          !editable && "bg-gray-100 dark:bg-gray-800 opacity-50",
          className
        )}
        style={style}
        {...getKeyboardProps()}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
