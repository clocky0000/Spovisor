import * as React from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { cn } from "./utils";

// --- Base Container Props ---
interface CardComponentProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// --- Card Root ---
function Card({ className, children, style, ...props }: CardComponentProps) {
  return (
    <View
      className={cn(
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex-col shadow-sm overflow-hidden",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Card Header ---
function CardHeader({ className, children, style, ...props }: CardComponentProps) {
  return (
    <View
      className={cn("p-6 flex-row items-start justify-between gap-4", className)}
      style={style}
      {...props}
    >
      <View className="flex-1 flex-col gap-1.5">{children}</View>
    </View>
  );
}

// --- Card Title (h4 대체) ---
interface CardTextProps extends React.ComponentPropsWithoutRef<typeof Text> {
  className?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

function CardTitle({ className, children, style, ...props }: CardTextProps) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 leading-none",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

// --- Card Description (p 대체) ---
function CardDescription({ className, children, style, ...props }: CardTextProps) {
  return (
    <Text
      className={cn(
        "text-sm text-gray-500 dark:text-gray-400 leading-relaxed",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

// --- Card Action (우측 상단 액션 버튼 영역) ---
function CardAction({ className, children, style, ...props }: CardComponentProps) {
  return (
    <View
      className={cn("items-end justify-start", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Card Content ---
function CardContent({ className, children, style, ...props }: CardComponentProps) {
  return (
    <View
      className={cn("px-6 pb-6", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Card Footer ---
function CardFooter({ className, children, style, ...props }: CardComponentProps) {
  return (
    <View
      className={cn(
        "flex-row items-center px-6 pb-6 pt-0 border-gray-100 dark:border-gray-800",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

export {
    Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
};
