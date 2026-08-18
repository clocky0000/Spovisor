import { X } from "lucide-react-native";
import * as React from "react";
import {
    Modal,
    Pressable,
    SafeAreaView,
    StyleProp,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type SheetContextProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SheetContext = React.createContext<SheetContextProps | null>(null);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within a <Sheet />");
  }
  return context;
}

// --- Sheet Root ---
export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Sheet({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean | ((prev: boolean) => boolean)) => {
      const computedOpen =
        typeof nextOpen === "function" ? nextOpen(open) : nextOpen;
      if (controlledOpen === undefined) {
        setUncontrolledOpen(computedOpen);
      }
      onOpenChange?.(computedOpen);
    },
    [controlledOpen, open, onOpenChange]
  );

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

// --- Sheet Trigger ---
export interface SheetTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  asChild?: boolean;
  children?: React.ReactNode;
}

function SheetTrigger({ onPress, children, ...props }: SheetTriggerProps) {
  const { setOpen } = useSheet();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        setOpen(true);
      }}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Sheet Close ---
export interface SheetCloseProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  children?: React.ReactNode;
}

function SheetClose({ onPress, children, ...props }: SheetCloseProps) {
  const { setOpen } = useSheet();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Sheet Content ---
export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function SheetContent({
  side = "right",
  className,
  children,
  style,
  ...props
}: SheetContentProps) {
  const { open, setOpen } = useSheet();

  if (!open) return null;

  const sideStyles = {
    right: "absolute top-0 bottom-0 right-0 w-3/4 max-w-sm border-l",
    left: "absolute top-0 bottom-0 left-0 w-3/4 max-w-sm border-r",
    top: "absolute top-0 left-0 right-0 border-b",
    bottom: "absolute bottom-0 left-0 right-0 border-t rounded-t-3xl",
  };

  return (
    <Modal
      transparent
      visible={open}
      animationType={side === "bottom" || side === "top" ? "slide" : "fade"}
      onRequestClose={() => setOpen(false)}
    >
      <View className="flex-1 bg-black/50 relative">
        {/* Backdrop Press Area */}
        <Pressable
          className="absolute inset-0"
          onPress={() => setOpen(false)}
        />

        {/* Sheet Content Body */}
        <SafeAreaView
          className={cn(
            "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl flex-col p-6",
            sideStyles[side],
            className
          )}
          style={style}
          {...props}
        >
          {/* Close Button */}
          <Pressable
            accessibilityLabel="Close sheet"
            onPress={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 z-10"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </Pressable>

          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// --- Subcomponents ---
function SheetHeader({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("flex-col gap-1.5 mb-4", className)} {...props}>
      {children}
    </View>
  );
}

function SheetFooter({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("mt-auto flex-col gap-2 pt-4", className)} {...props}>
      {children}
    </View>
  );
}

function SheetTitle({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold text-gray-900 dark:text-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

function SheetDescription({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text
      className={cn(
        "text-sm text-gray-500 dark:text-gray-400",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export {
    Sheet, SheetClose,
    SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, useSheet
};
