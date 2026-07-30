import * as React from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import { cn } from "./utils";

// --- Context ---
type CollapsibleContextProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
};

const CollapsibleContext = React.createContext<CollapsibleContextProps | null>(null);

function useCollapsible() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within a <Collapsible />");
  }
  return context;
}

// --- Collapsible Root ---
export interface CollapsibleProps extends React.ComponentPropsWithoutRef<typeof View> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function Collapsible({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
  children,
  style,
  ...props
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isOpen = openProp !== undefined ? openProp : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (disabled) return;
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [disabled, openProp, onOpenChange]
  );

  return (
    <CollapsibleContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange, disabled }}
    >
      <View className={cn("w-full", className)} style={style} {...props}>
        {children}
      </View>
    </CollapsibleContext.Provider>
  );
}

// --- Collapsible Trigger ---
export interface CollapsibleTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function CollapsibleTrigger({
  className,
  children,
  style,
  disabled: disabledProp,
  ...props
}: CollapsibleTriggerProps) {
  const { open, onOpenChange, disabled: contextDisabled } = useCollapsible();
  const isDisabled = disabledProp || contextDisabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => onOpenChange(!open)}
      className={cn("active:opacity-80", isDisabled && "opacity-50", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Collapsible Content ---
export interface CollapsibleContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function CollapsibleContent({
  className,
  children,
  style,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsible();

  if (!open) return null;

  return (
    <View className={cn("overflow-hidden", className)} style={style} {...props}>
      {children}
    </View>
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger, useCollapsible };
