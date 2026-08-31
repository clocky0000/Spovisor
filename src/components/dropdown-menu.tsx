import { Check, ChevronRight, Circle } from "lucide-react-native";
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
type DropdownMenuContextProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextProps | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(
      "DropdownMenu components must be used within a <DropdownMenu />"
    );
  }
  return context;
}

// --- DropdownMenu Root ---
export interface DropdownMenuProps {
  children?: React.ReactNode;
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <View className="relative">{children}</View>
    </DropdownMenuContext.Provider>
  );
}

// --- DropdownMenu Trigger ---
export interface DropdownMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DropdownMenuTrigger({
  className,
  children,
  style,
  onPress,
  ...props
}: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenu();

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

// --- DropdownMenu Content (Modal 기반 Popover) ---
export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DropdownMenuContent({
  className,
  children,
  style,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdownMenu();

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
        className="flex-1 bg-black/40 justify-center items-center p-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1.5 shadow-2xl gap-0.5",
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

// --- DropdownMenu Item ---
export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  inset?: boolean;
  variant?: "default" | "destructive";
  onSelect?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DropdownMenuItem({
  inset,
  variant = "default",
  onSelect,
  disabled,
  className,
  children,
  style,
  onPress,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  const handlePress = (e: any) => {
    if (disabled) return;
    onPress?.(e);
    onSelect?.();
    setOpen(false);
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      className={cn(
        "flex-row items-center px-3 py-2.5 rounded-xl gap-2.5 active:bg-gray-100 dark:active:bg-gray-800 transition-all",
        inset && "pl-9",
        disabled && "opacity-40",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-sm font-medium text-gray-900 dark:text-gray-100 flex-1",
            variant === "destructive" && "text-red-600 dark:text-red-400"
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// --- DropdownMenu Checkbox Item ---
export interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked?: boolean;
}

function DropdownMenuCheckboxItem({
  checked = false,
  children,
  className,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenuItem className={cn("pl-9 relative", className)} {...props}>
      <View className="absolute left-2.5 h-4 w-4 items-center justify-center">
        {checked && <Check size={16} className="text-gray-900 dark:text-gray-100" />}
      </View>
      {children}
    </DropdownMenuItem>
  );
}

// --- DropdownMenu Radio Item ---
export interface DropdownMenuRadioItemProps extends DropdownMenuItemProps {
  selected?: boolean;
}

function DropdownMenuRadioItem({
  selected = false,
  children,
  className,
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <DropdownMenuItem className={cn("pl-9 relative", className)} {...props}>
      <View className="absolute left-2.5 h-4 w-4 items-center justify-center">
        {selected && (
          <Circle
            size={8}
            className="fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-gray-100"
          />
        )}
      </View>
      {children}
    </DropdownMenuItem>
  );
}

// --- DropdownMenu Label ---
export interface DropdownMenuLabelProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  inset?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function DropdownMenuLabel({
  inset,
  className,
  children,
  ...props
}: DropdownMenuLabelProps) {
  return (
    <View className={cn("px-3 py-1.5", inset && "pl-9", className)} {...props}>
      <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {children}
      </Text>
    </View>
  );
}

// --- DropdownMenu Separator ---
function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <View
      className={cn("h-px bg-gray-100 dark:bg-gray-800 -mx-1.5 my-1", className)}
    />
  );
}

// --- DropdownMenu Shortcut ---
function DropdownMenuShortcut({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Text
      className={cn(
        "ml-auto text-xs text-gray-400 dark:text-gray-500 tracking-widest",
        className
      )}
    >
      {children}
    </Text>
  );
}

// --- Passthrough Wrapper Containers ---
function DropdownMenuGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuSub({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

function DropdownMenuSubTrigger({ children }: { children?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-3 py-2.5">
      {children}
      <ChevronRight size={16} className="text-gray-400" />
    </View>
  );
}

function DropdownMenuSubContent({ children }: { children?: React.ReactNode }) {
  return <View className="pl-4">{children}</View>;
}

function DropdownMenuRadioGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

export {
    DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
    DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, useDropdownMenu
};
