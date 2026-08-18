import * as React from "react";
import {
    Modal,
    Pressable,
    StyleProp,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type DrawerContextProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error("Drawer components must be used within a <Drawer />");
  }
  return context;
}

// --- Drawer Root ---
export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: DrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isOpen = openProp !== undefined ? openProp : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [openProp, onOpenChange]
  );

  return (
    <DrawerContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

// --- Drawer Trigger ---
export interface DrawerTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DrawerTrigger({
  className,
  children,
  style,
  onPress,
  ...props
}: DrawerTriggerProps) {
  const { onOpenChange } = useDrawer();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        onOpenChange(true);
      }}
      className={cn("active:opacity-80", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Drawer Close ---
export interface DrawerCloseProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DrawerClose({
  className,
  children,
  style,
  onPress,
  ...props
}: DrawerCloseProps) {
  const { onOpenChange } = useDrawer();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        onOpenChange(false);
      }}
      className={cn("active:opacity-80", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Drawer Portal & Overlay ---
function DrawerPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DrawerOverlay({ className }: { className?: string }) {
  return (
    <View
      className={cn("absolute inset-0 bg-black/60", className)}
    />
  );
}

// --- Drawer Content ---
export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DrawerContent({
  className,
  children,
  style,
  ...props
}: DrawerContentProps) {
  const { open, onOpenChange } = useDrawer();

  if (!open) return null;

  return (
    <Modal
      transparent
      visible={open}
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <View className="flex-1 justify-end">
        {/* Background Overlay Pressable */}
        <Pressable
          onPress={() => onOpenChange(false)}
          className="absolute inset-0 bg-black/60"
        />

        {/* Bottom Sheet Card Content */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={cn(
            "w-full bg-white dark:bg-gray-900 rounded-t-3xl border-t border-gray-200 dark:border-gray-800 pb-8 pt-3 shadow-2xl max-h-[85%]",
            className
          )}
          style={style}
          {...props}
        >
          {/* Drag Handle Indicator */}
          <View className="mx-auto h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700 mb-3" />
          {children}
        </Pressable>
      </View>
    </Modal>

  );
}

// --- Drawer Header & Footer ---
function DrawerHeader({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("flex-col gap-1.5 p-4", className)} style={style} {...props}>
      {children}
    </View>
  );
}

function DrawerFooter({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View
      className={cn("mt-auto flex-col gap-2 p-4 pt-2", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Drawer Title & Description ---
function DrawerTitle({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold text-gray-900 dark:text-gray-100",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

function DrawerDescription({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text
      className={cn("text-sm text-gray-500 dark:text-gray-400 leading-relaxed", className)}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export {
    Drawer, DrawerClose,
    DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger, useDrawer
};
