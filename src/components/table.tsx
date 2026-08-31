import * as React from "react";
import {
    ScrollView,
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/* Table Container & Root                                                      */
/* -------------------------------------------------------------------------- */

export interface TableProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Table({ className, style, children, ...props }: TableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className={cn("w-full min-w-[500px]", className)} style={style} {...props}>
        {children}
      </View>
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/* Table Header & Body & Footer                                              */
/* -------------------------------------------------------------------------- */

function TableHeader({ className, style, ...props }: TableProps) {
  return (
    <View
      className={cn("border-b border-gray-200 dark:border-gray-800", className)}
      style={style}
      {...props}
    />
  );
}

function TableBody({ className, style, ...props }: TableProps) {
  return <View className={cn("flex-col", className)} style={style} {...props} />;
}

function TableFooter({ className, style, ...props }: TableProps) {
  return (
    <View
      className={cn(
        "bg-gray-100 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 font-medium",
        className
      )}
      style={style}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Table Row & Cell components                                                */
/* -------------------------------------------------------------------------- */

function TableRow({ className, style, ...props }: TableProps) {
  return (
    <View
      className={cn(
        "flex-row items-center border-b border-gray-200 dark:border-gray-800",
        className
      )}
      style={style}
      {...props}
    />
  );
}

export interface TableCellProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function TableHead({
  className,
  textClassName,
  style,
  textStyle,
  children,
  ...props
}: TableCellProps) {
  return (
    <View
      className={cn("h-10 px-3 justify-center flex-1 min-w-[100px]", className)}
      style={style}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn(
            "text-gray-900 dark:text-gray-100 font-medium text-sm text-left",
            textClassName
          )}
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

function TableCell({
  className,
  textClassName,
  style,
  textStyle,
  children,
  ...props}: TableCellProps) {
  return (
    <View
      className={cn("p-3 justify-center flex-1 min-w-[100px]", className)}
      style={style}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn("text-gray-700 dark:text-gray-300 text-sm", textClassName)}
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

function TableCaption({
  className,
  textClassName,
  style,
  textStyle,
  children,
  ...props
}: TableCellProps) {
  return (
    <View className={cn("mt-4 items-center justify-center", className)} style={style} {...props}>
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn("text-gray-500 dark:text-gray-400 text-xs", textClassName)}
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

export {
    Table, TableBody, TableCaption, TableCell, TableFooter,
    TableHead, TableHeader, TableRow
};
