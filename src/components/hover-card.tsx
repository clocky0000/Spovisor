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
type HoverCardContextProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const HoverCardContext = React.createContext<HoverCardContextProps | null>(null);

function useHoverCard() {
  const context = React.useContext(HoverCardContext);
  if (!context) {
    throw new Error("HoverCard components must be used within a <HoverCard />");
  }
  return context;
}

// --- HoverCard Root ---
export interface HoverCardProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function HoverCard({
  children,
  open: openProp,
  onOpenChange,
}: HoverCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isOpen = openProp !== undefined ? openProp : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [openProp, onOpenChange]
  );

  return (
    <HoverCardContext.Provider value={{ open: isOpen, setOpen }}>
      <View className="relative">{children}</View>
    </HoverCardContext.Provider>
  );
}

// --- HoverCard Trigger (터치 시 Popover 토글) ---
export interface HoverCardTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function HoverCardTrigger({
  className,
  children,
  style,
  onPress,
  ...props
}: HoverCardTriggerProps) {
  const { open, setOpen } = useHoverCard();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={(e) => {
        onPress?.(e);
        setOpen(!open);
      }}
      className={cn("active:opacity-80", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- HoverCard Content (Modal 기반 카드) ---
export interface HoverCardContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function HoverCardContent({
  className,
  children,
  style,
  ...props
}: HoverCardContentProps) {
  const { open, setOpen } = useHoverCard();

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
            "w-full max-w-[320px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xl",
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

export { HoverCard, HoverCardContent, HoverCardTrigger, useHoverCard };
