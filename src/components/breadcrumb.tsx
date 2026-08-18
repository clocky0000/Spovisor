import { ChevronRight, MoreHorizontal } from "lucide-react-native";
import * as React from "react";
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { cn } from "./utils";

// --- Root (nav 대체) ---
interface BreadcrumbProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function Breadcrumb({ className, children, style, ...props }: BreadcrumbProps) {
  return (
    <View className={cn("w-full", className)} style={style} {...props}>
      {children}
    </View>
  );
}

// --- List (ol 대체) ---
function BreadcrumbList({ className, children, style, ...props }: BreadcrumbProps) {
  return (
    <View
      className={cn("flex-row flex-wrap items-center gap-1.5", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Item (li 대체) ---
function BreadcrumbItem({ className, children, style, ...props }: BreadcrumbProps) {
  return (
    <View
      className={cn("inline-flex flex-row items-center gap-1.5", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Link (a 대체 / 클릭 가능) ---
interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  onPress?: () => void;
}

function BreadcrumbLink({
  className,
  textClassName,
  textStyle,
  children,
  onPress,
  style,
  ...props
}: BreadcrumbLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn("active:opacity-70", className)}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-sm font-medium text-gray-500 dark:text-gray-400 active:text-gray-900 dark:active:text-gray-100",
            textClassName
          )}
          style={textStyle}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// --- Current Page (span 대체 / 현재 위치 표시) ---
interface BreadcrumbPageProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function BreadcrumbPage({
  className,
  textClassName,
  textStyle,
  children,
  style,
  ...props
}: BreadcrumbPageProps) {
  return (
    <View className={cn("inline-flex flex-row items-center", className)} style={style} {...props}>
      {typeof children === "string" ? (
        <Text
          className={cn("text-sm font-normal text-gray-900 dark:text-gray-100", textClassName)}
          style={textStyle}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

// --- Separator (ChevronRight 아이콘 구분자) ---
function BreadcrumbSeparator({
  children,
  className,
  style,
  ...props
}: BreadcrumbProps) {
  return (
    <View className={cn("items-center justify-center", className)} style={style} {...props}>
      {children ?? <ChevronRight size={14} className="text-gray-400 dark:text-gray-500" />}
    </View>
  );
}

// --- Ellipsis (MoreHorizontal 아이콘 줄임표) ---
function BreadcrumbEllipsis({
  className,
  style,
  ...props
}: BreadcrumbProps) {
  return (
    <View
      className={cn("flex-row h-7 w-7 items-center justify-center", className)}
      style={style}
      {...props}
    >
      <MoreHorizontal size={16} className="text-gray-500 dark:text-gray-400" />
    </View>
  );
}

export {
    Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem,
    BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
};
