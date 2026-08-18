import * as React from "react";
import {
    Modal,
    Pressable,
    StyleProp,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type PopoverContextProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const PopoverContext = React.createContext<PopoverContextProps | null>(null);

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover components must be used within <Popover />");
  }
  return context;
}

// --- Popover Root ---
export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Popover({
  open: controlledOpen,
  onOpenChange,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const nextOpen = typeof value === "function" ? value(open) : value;
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, open, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
}

// --- Popover Trigger ---
export interface PopoverTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  asChild?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function PopoverTrigger({
  className,
  children,
  style,
  onPress,
  ...props
}: PopoverTriggerProps) {
  const { open, setOpen } = usePopover();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={(e) => {
        onPress?.(e);
        setOpen((prev) => !prev);
      }}
      className={cn("active:opacity-80", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Popover Content ---
export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function PopoverContent({
  className,
  children,
  style,
  ...props
}: PopoverContentProps) {
  const { open, setOpen } = usePopover();

  if (!open) return null;

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        onPress={() => setOpen(false)}
        className="flex-1 bg-black/30 justify-center items-center p-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xl gap-2",
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

// --- Popover Anchor ---
function PopoverAnchor({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger, usePopover };
