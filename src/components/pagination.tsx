import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react-native";
import * as React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { Button, ButtonProps } from "./button";
import { cn } from "./utils";

// --- Pagination Root ---
export interface PaginationProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function Pagination({ className, children, style, ...props }: PaginationProps) {
  return (
    <View
      accessibilityRole="none"
      aria-label="pagination"
      className={cn("w-full flex-row justify-center my-2", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Pagination Content ---
function PaginationContent({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View
      className={cn("flex-row items-center gap-1", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Pagination Item ---
function PaginationItem({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={className} style={style} {...props}>
      {children}
    </View>
  );
}

// --- Pagination Link ---
export interface PaginationLinkProps extends Omit<ButtonProps, "variant"> {
  isActive?: boolean;
  onPress?: () => void;
  className?: string;
  children?: React.ReactNode;
}

function PaginationLink({
  className,
  isActive,
  size = "icon",
  children,
  onPress,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      onPress={onPress}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "h-9 min-w-[36px] px-2.5",
        isActive && "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-sm font-medium text-gray-700 dark:text-gray-300",
            isActive && "text-gray-900 dark:text-gray-100 font-semibold"
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Button>
  );
}

// --- Pagination Previous ---
export interface PaginationPreviousProps extends PaginationLinkProps {
  label?: string;
}

function PaginationPrevious({
  className,
  label = "Previous",
  ...props
}: PaginationPreviousProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("flex-row items-center gap-1 px-3", className)}
      {...props}
    >
      <ChevronLeft size={16} className="text-gray-700 dark:text-gray-300" />
      {label ? (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Text>
      ) : null}
    </PaginationLink>
  );
}

// --- Pagination Next ---
export interface PaginationNextProps extends PaginationLinkProps {
  label?: string;
}

function PaginationNext({
  className,
  label = "Next",
  ...props
}: PaginationNextProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("flex-row items-center gap-1 px-3", className)}
      {...props}
    >
      {label ? (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Text>
      ) : null}
      <ChevronRight size={16} className="text-gray-700 dark:text-gray-300" />
    </PaginationLink>
  );
}

// --- Pagination Ellipsis ---
function PaginationEllipsis({
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View
      aria-hidden
      className={cn("h-9 w-9 items-center justify-center", className)}
      style={style}
      {...props}
    >
      <MoreHorizontal size={16} className="text-gray-400 dark:text-gray-500" />
    </View>
  );
}

export {
    Pagination,
    PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
};
