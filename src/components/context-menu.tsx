import { Check, ChevronRight, Circle } from "lucide-react-native";
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
type ContextMenuContextProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ContextMenuContext = React.createContext<ContextMenuContextProps | null>(null);

function useContextMenu() {
  const context = React.useContext(ContextMenuContext);
  if (!context) {
    throw new Error("ContextMenu components must be used within a <ContextMenu />");
  }
  return context;
}

// --- ContextMenu Root ---
export interface ContextMenuProps {
  children?: React.ReactNode;
}

function ContextMenu({ children }: ContextMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <ContextMenuContext.Provider value={{ open, setOpen }}>
      <View className="relative">{children}</View>
    </ContextMenuContext.Provider>
  );
}

// --- ContextMenu Trigger (Long Press 지원) ---
export interface ContextMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function ContextMenuTrigger({
  className,
  children,
  style,
  ...props
}: ContextMenuTriggerProps) {
  const { setOpen } = useContextMenu();

  return (
    <Pressable
      onLongPress={() => setOpen(true)}
      delayLongPress={300}
      className={cn("active:opacity-80", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- ContextMenu Content (Modal 기반 Popover) ---
export interface ContextMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function ContextMenuContent({
  className,
  children,
  style,
  ...props
}: ContextMenuContentProps) {
  const { open, setOpen } = useContextMenu();

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
            "w-full max-w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1.5 shadow-2xl",
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

// --- ContextMenu Item ---
export interface ContextMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  inset?: boolean;
  variant?: "default" | "destructive";
  onSelect?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function ContextMenuItem({
  inset,
  variant = "default",
  onSelect,
  disabled,
  className,
  children,
  style,
  ...props
}: ContextMenuItemProps) {
  const { setOpen } = useContextMenu();

  const handlePress = () => {
    if (disabled) return;
    setOpen(false);
    onSelect?.();
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

// --- ContextMenu Checkbox Item ---
export interface ContextMenuCheckboxItemProps extends ContextMenuItemProps {
  checked?: boolean;
}

function ContextMenuCheckboxItem({
  checked = false,
  children,
  className,
  ...props
}: ContextMenuCheckboxItemProps) {
  return (
    <ContextMenuItem className={cn("pl-9 relative", className)} {...props}>
      <View className="absolute left-2.5 h-4 w-4 items-center justify-center">
        {checked && <Check size={16} className="text-gray-900 dark:text-gray-100" />}
      </View>
      {children}
    </ContextMenuItem>
  );
}

// --- ContextMenu Radio Item ---
export interface ContextMenuRadioItemProps extends ContextMenuItemProps {
  value?: string;
  selected?: boolean;
}

function ContextMenuRadioItem({
  selected = false,
  children,
  className,
  ...props
}: ContextMenuRadioItemProps) {
  return (
    <ContextMenuItem className={cn("pl-9 relative", className)} {...props}>
      <View className="absolute left-2.5 h-4 w-4 items-center justify-center">
        {selected && (
          <Circle size={8} className="fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-gray-100" />
        )}
      </View>
      {children}
    </ContextMenuItem>
  );
}

// --- ContextMenu Label ---
export interface ContextMenuLabelProps extends React.ComponentPropsWithoutRef<typeof View> {
  inset?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function ContextMenuLabel({ inset, className, children, ...props }: ContextMenuLabelProps) {
  return (
    <View className={cn("px-3 py-1.5", inset && "pl-9", className)} {...props}>
      <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {children}
      </Text>
    </View>
  );
}

// --- ContextMenu Separator ---
function ContextMenuSeparator({ className }: { className?: string }) {
  return <View className={cn("h-px bg-gray-100 dark:bg-gray-800 -mx-1.5 my-1", className)} />;
}

// --- ContextMenu Shortcut ---
function ContextMenuShortcut({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <Text className={cn("ml-auto text-xs text-gray-400 dark:text-gray-500 tracking-widest", className)}>
      {children}
    </Text>
  );
}

// --- Dummy Passthrough Containers for Submenus/Groups ---
function ContextMenuGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}
function ContextMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function ContextMenuSub({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}
function ContextMenuSubTrigger({ children }: { children?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-3 py-2.5">
      {children}
      <ChevronRight size={16} className="text-gray-400" />
    </View>
  );
}
function ContextMenuSubContent({ children }: { children?: React.ReactNode }) {
  return <View className="pl-4">{children}</View>;
}
function ContextMenuRadioGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

export {
    ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator,
    ContextMenuShortcut, ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger, ContextMenuTrigger
};
