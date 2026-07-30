import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react-native";
import * as React from "react";
import {
    Modal,
    Pressable,
    StyleProp,
    Text,
    View,
    ViewStyle
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type NavigationMenuContextProps = {
  value: string | null;
  setValue: (value: string | null) => void;
};

const NavigationMenuContext =
  React.createContext<NavigationMenuContextProps | null>(null);

function useNavigationMenu() {
  const context = React.useContext(NavigationMenuContext);
  if (!context) {
    throw new Error(
      "NavigationMenu components must be used within <NavigationMenu />"
    );
  }
  return context;
}

type NavigationMenuItemContextProps = {
  value: string;
};

const NavigationMenuItemContext =
  React.createContext<NavigationMenuItemContextProps | null>(null);

function useNavigationMenuItem() {
  const context = React.useContext(NavigationMenuItemContext);
  if (!context) {
    throw new Error(
      "NavigationMenuTrigger/Content must be used within <NavigationMenuItem />"
    );
  }
  return context;
}

// --- NavigationMenu Root ---
export interface NavigationMenuProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function NavigationMenu({
  value: valueProp,
  onValueChange,
  className,
  children,
  style,
  ...props
}: NavigationMenuProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | null
  >(null);

  const value = valueProp !== undefined ? valueProp : uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: string | null) => {
      if (valueProp === undefined) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [valueProp, onValueChange]
  );

  return (
    <NavigationMenuContext.Provider value={{ value, setValue }}>
      <View
        className={cn("flex-row items-center justify-center", className)}
        style={style}
        {...props}
      >
        {children}
      </View>
    </NavigationMenuContext.Provider>
  );
}

// --- NavigationMenu List ---
function NavigationMenuList({
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

// --- NavigationMenu Item ---
export interface NavigationMenuItemProps {
  value?: string;
  children?: React.ReactNode;
}

function NavigationMenuItem({
  value: valueProp,
  children,
}: NavigationMenuItemProps) {
  const generatedId = React.useId();
  const value = valueProp ?? generatedId;

  return (
    <NavigationMenuItemContext.Provider value={{ value }}>
      <View className="relative">{children}</View>
    </NavigationMenuItemContext.Provider>
  );
}

// --- Trigger Style (CVA) ---
const navigationMenuTriggerStyle = cva(
  "flex-row items-center justify-center rounded-xl px-3.5 py-2 active:bg-gray-100 dark:active:bg-gray-800 transition-all"
);

// --- NavigationMenu Trigger ---
export interface NavigationMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function NavigationMenuTrigger({
  className,
  children,
  style,
  onPress,
  ...props
}: NavigationMenuTriggerProps) {
  const { value: activeValue, setValue } = useNavigationMenu();
  const { value } = useNavigationMenuItem();
  const isOpen = activeValue === value;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      onPress={(e) => {
        onPress?.(e);
        setValue(isOpen ? null : value);
      }}
      className={cn(navigationMenuTriggerStyle(), className)}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className="text-sm font-medium text-gray-900 dark:text-gray-100 mr-1.5">
          {children}
        </Text>
      ) : (
        children
      )}
      <ChevronDown
        size={14}
        className={cn(
          "text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </Pressable>
  );
}

// --- NavigationMenu Content (Modal Popover) ---
export interface NavigationMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function NavigationMenuContent({
  className,
  children,
  style,
  ...props
}: NavigationMenuContentProps) {
  const { value: activeValue, setValue } = useNavigationMenu();
  const { value } = useNavigationMenuItem();

  const isOpen = activeValue === value;
  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={() => setValue(null)}
    >
      <Pressable
        onPress={() => setValue(null)}
        className="flex-1 bg-black/40 justify-center items-center p-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-2xl gap-2",
            className
          )}
          style={style}
          {...props}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- NavigationMenu Link ---
export interface NavigationMenuLinkProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  active?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function NavigationMenuLink({
  active,
  className,
  children,
  style,
  onPress,
  ...props
}: NavigationMenuLinkProps) {
  const { setValue } = useNavigationMenu();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={(e) => {
        onPress?.(e);
        setValue(null);
      }}
      className={cn(
        "p-2.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-all",
        active && "bg-gray-100 dark:bg-gray-800",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// --- Dummy Passthrough Viewport/Indicator for API Parity ---
function NavigationMenuViewport({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function NavigationMenuIndicator() {
  return null;
}

export {
    NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport, useNavigationMenu
};
