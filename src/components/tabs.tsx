timport * as React from "react";
import {
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a <Tabs /> provider");
  }
  return context;
}

/* -------------------------------------------------------------------------- */
/* Tabs Root                                                                  */
/* -------------------------------------------------------------------------- */

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof View> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  style,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? ""
  );

  const activeValue =
    controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (val: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(val);
      }
      onValueChange?.(val);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider
      value={{ value: activeValue, onValueChange: handleValueChange }}
    >
      <View className={cn("flex flex-col gap-2", className)} style={style} {...props}>
        {children}
      </View>
    </TabsContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* TabsList                                                                   */
/* -------------------------------------------------------------------------- */

function TabsList({ className, style, ...props }: TabsProps) {
  return (
    <View
      className={cn(
        "bg-gray-100 dark:bg-gray-800 flex-row h-10 w-full items-center justify-center rounded-xl p-1",
        className
      )}
      style={style}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* TabsTrigger                                                                */
/* -------------------------------------------------------------------------- */

export interface TabsTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Pressable>, "style"> {
  value: string;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function TabsTrigger({
  value: triggerValue,
  disabled = false,
  className,
  textClassName,
  style,
  textStyle,
  children,
  onPress,
  ...props
}: TabsTriggerProps) {
  const { value, onValueChange } = useTabsContext();
  const isActive = value === triggerValue;

  const handlePress = (e: any) => {
    if (disabled) return;
    onPress?.(e);
    onValueChange(triggerValue);
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive, disabled }}
      disabled={disabled}
      onPress={handlePress}
      className={cn(
        "flex-1 flex-row h-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
        isActive
          ? "bg-white dark:bg-gray-900 shadow-sm"
          : "bg-transparent",
        disabled && "opacity-50",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn(
            "text-sm font-medium",
            isActive
              ? "text-gray-900 dark:text-gray-100 font-semibold"
              : "text-gray-500 dark:text-gray-400",
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

/* -------------------------------------------------------------------------- */
/* TabsContent                                                                */
/* -------------------------------------------------------------------------- */

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  value: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function TabsContent({
  value: contentValue,
  className,
  style,
  children,
  ...props
}: TabsContentProps) {
  const { value } = useTabsContext();

  if (value !== contentValue) {
    return null;
  }

  return (
    <View
      accessibilityRole="tabpanel"
      className={cn("flex-1 mt-1", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };