import { Check, ChevronDown } from "lucide-react-native";
import * as React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleProp,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type SelectContextProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean;
};

const SelectContext = React.createContext<SelectContextProps | null>(null);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a <Select />");
  }
  return context;
}

// --- Select Root ---
export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  disabled = false,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [controlledValue, onValueChange]
  );

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
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        disabled,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

// --- Select Trigger ---
export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  size?: "sm" | "default";
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function SelectTrigger({
  size = "default",
  className,
  children,
  style,
  onPress,
  ...props
}: SelectTriggerProps) {
  const { open, setOpen, disabled } = useSelect();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open, disabled }}
      disabled={disabled}
      onPress={(e) => {
        if (disabled) return;
        onPress?.(e);
        setOpen((prev) => !prev);
      }}
      className={cn(
        "flex-row items-center justify-between w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl px-3.5 transition-all active:opacity-80",
        size === "default" ? "h-11" : "h-9",
        disabled && "opacity-50 bg-gray-100 dark:bg-gray-800",
        className
      )}
      style={style}
      {...props}
    >
      <View className="flex-1 flex-row items-center pr-2">{children}</View>
      <ChevronDown
        size={16}
        className={cn(
          "text-gray-400 dark:text-gray-500 transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </Pressable>
  );
}

// --- Select Value ---
export interface SelectValueProps
  extends React.ComponentPropsWithoutRef<typeof Text> {
  placeholder?: string;
  className?: string;
}

function SelectValue({ placeholder, className, children, ...props }: SelectValueProps) {
  const { value } = useSelect();

  const displayContent = value || children || placeholder;
  const isPlaceholder = !value && !children && !!placeholder;

  return (
    <Text
      numberOfLines={1}
      className={cn(
        "text-base text-gray-900 dark:text-gray-100 font-medium",
        isPlaceholder && "text-gray-400 dark:text-gray-500 font-normal",
        className
      )}
      {...props}
    >
      {displayContent}
    </Text>
  );
}

// --- Select Content (Modal Dialog) ---
export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function SelectContent({
  className,
  children,
  style,
  ...props
}: SelectContentProps) {
  const { open, setOpen } = useSelect();

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
            "w-full max-w-xs max-h-[360px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1.5 shadow-2xl",
            className
          )}
          style={style}
          {...props}
        >
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- Select Item ---
export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  value: string;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function SelectItem({
  value: itemValue,
  disabled = false,
  className,
  children,
  style,
  onPress,
  ...props
}: SelectItemProps) {
  const { value, onValueChange, setOpen } = useSelect();
  const isSelected = value === itemValue;

  const handlePress = (e: any) => {
    if (disabled) return;
    onPress?.(e);
    onValueChange?.(itemValue);
    setOpen(false);
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      className={cn(
        "flex-row items-center justify-between px-3.5 py-3 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-all my-0.5",
        isSelected && "bg-blue-50 dark:bg-blue-950/40",
        disabled && "opacity-40",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-base text-gray-900 dark:text-gray-100 font-medium flex-1 mr-2",
            isSelected && "text-blue-600 dark:text-blue-400 font-semibold"
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
      {isSelected && (
        <Check
          size={18}
          className="text-blue-600 dark:text-blue-400 shrink-0"
        />
      )}
    </Pressable>
  );
}

// --- Select Group & Label & Separator ---
function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

function SelectLabel({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className={cn("px-3.5 py-2", className)}>
      <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {children}
      </Text>
    </View>
  );
}

function SelectSeparator({ className }: { className?: string }) {
  return (
    <View className={cn("h-px bg-gray-100 dark:bg-gray-800 my-1 -mx-1.5", className)} />
  );
}

// --- Dummy Passthrough Scroll Buttons for API Parity ---
function SelectScrollUpButton() {
  return null;
}

function SelectScrollDownButton() {
  return null;
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
    useSelect
};
