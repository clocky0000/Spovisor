import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

import { cn } from "./utils";

// --- Alert Variants (NativeWind / Flexbox 기반) ---
const alertVariants = cva(
  "relative w-full rounded-xl border p-4 flex-row items-start gap-3",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100",
        destructive:
          "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AlertProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof alertVariants> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// --- Alert Root ---
function Alert({ className, variant, children, style, ...props }: AlertProps) {
  // 아이콘과 텍스트 영역을 분리하여 레이아웃을 쉽게 잡을 수 있도록 분기 처리
  const childrenArray = React.Children.toArray(children);
  const hasMultipleChildren = childrenArray.length > 1;

  return (
    <View
      className={cn(alertVariants({ variant }), className)}
      style={style}
      {...props}
    >
      {/* 단일 아이콘 또는 좌측 콘텐츠 영역 */}
      {hasMultipleChildren ? (
        <>
          {/* 첫 번째 요소(보통 아이콘) */}
          <View className="mt-0.5">{childrenArray[0]}</View>
          {/* 오른쪽 텍스트 컨텐츠 영역 (Title + Description) */}
          <View className="flex-1 gap-1">{childrenArray.slice(1)}</View>
        </>
      ) : (
        <View className="flex-1 gap-1">{children}</View>
      )}
    </View>
  );
}

// --- Alert Title ---
interface AlertTitleProps extends React.ComponentPropsWithoutRef<typeof Text> {
  className?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

function AlertTitle({ className, children, style, ...props }: AlertTitleProps) {
  return (
    <Text
      className={cn(
        "font-semibold text-sm leading-none tracking-tight text-gray-900 dark:text-gray-100",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

// --- Alert Description ---
interface AlertDescriptionProps extends React.ComponentPropsWithoutRef<typeof Text> {
  className?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

function AlertDescription({
  className,
  children,
  style,
  ...props
}: AlertDescriptionProps) {
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

export { Alert, AlertDescription, AlertTitle };
