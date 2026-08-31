import { Check, ChevronRight, Circle } from "lucide-react-native";
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
type MenubarContextProps = {
  activeMenu: string | null;
  setActiveMenu: (value: string | null) => void;
};

const MenubarContext = React.createContext<MenubarContextProps | null>(null);

function useMenubar() {
  const context = React.useContext(MenubarContext);
  if (!context) {
    throw new Error("Menubar components must be used within a <Menubar />");
  }
  return context;
}

type MenubarMenuContextProps = {
  value: string;
};

const MenubarMenuContext = React.createContext<MenubarMenuContextProps | null>(null);

function useMenubarMenu() {
  const context = React.useContext(MenubarMenuContext);
  if (!context) {
    throw new Error("MenubarTrigger/Content must be used within <MenubarMenu />");
  }
  return context;
}

// --- Menubar Root ---
export interface MenubarProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function Menubar({ className, children, style, ...props }: MenubarProps) {
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  return (
    <MenubarContext.Provider value={{ activeMenu, setActiveMenu }}>
      <View
        className={cn(
          "flex-row items-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1",
          className
        )}
        style={style}
        {...props}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: "center", gap: 4 }}
        >
          {children}
        </ScrollView>
      </View>
    </MenubarContext.Provider>
  );
}

// --- Menubar Menu ---
export interface MenubarMenuProps {
  value?: string;
  children?: React.ReactNode;
}

function MenubarMenu({ value: valueProp, children }: MenubarMenuProps) {
  const generatedId = React.useId();
  const value = valueProp ?? generatedId;

  return (
    <MenubarMenuContext.Provider value={{ value }}>
      {children}
    </MenubarMenuContext.Provider>
  );
}

// --- Menubar Trigger ---
export interface MenubarTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function MenubarTrigger({
  className,
  children,
  style,
  onPress,
  ...props
}: MenubarTriggerProps) {
  const { activeMenu, setActiveMenu } = useMenubar();
  const { value } = useMenubarMenu();
  const isOpen = activeMenu === value;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      onPress={(e) => {
        onPress?.(e);
        setActiveMenu(isOpen ? null : value);
      }}
      className={cn(
        "px-3 py-1.5 rounded-lg active:bg-gray-200 dark:active:bg-gray-700",
        isOpen && "bg-white dark:bg-gray-900 shadow-sm",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-sm font-medium text-gray-700 dark:text-gray-300",
            isOpen && "text-gray-900 dark:text-gray-100 font-semibold"
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

// --- Menubar Content (Modal Popover) ---
export interface MenubarContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function MenubarContent({
  className,
  children,
  style,
  ...props
}: MenubarContentProps) {
  const { activeMenu, setActiveMenu } = useMenubar();
  const { value } = useMenubarMenu();

  const isOpen = activeMenu === value;
  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={() => setActiveMenu(null)}
    >
      <Pressable
        onPress={() => setActiveMenu(null)}
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

// --- Menubar Item ---
export interface MenubarItemProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  inset?: boolean;
  variant?: "default" | "destructive";
  onSelect?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function MenubarItem({
  inset,
  variant = "default",
  onSelect,
  disabled,
  className,
  children,
  style,
  onPress,
  ...props
}: MenubarItemProps) {
  const { setActiveMenu } = useMenubar();

  const handlePress = (e: any) => {
    if (disabled) return;
    onPress?.(e);
    onSelect?.();
    setActiveMenu(null);
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

// --- Menubar Checkbox Item ---
export interface MenubarCheckboxItemProps extends MenubarItemProps {
  checked?: boolean;
}

function MenubarCheckboxItem({
  checked = false,
  children,
  className,
  ...props
}: MenubarCheckboxItemProps) {
  return (
    <MenubarItem className={cn("pl-9 relative", className)} {...props}>
      <View className="absolute left-2.5 h-4 w-4 items-center justify-center">
        {checked && <Check size={16} className="text-gray-900 dark:text-gray-100" />}
      </View>
      {children}
    </MenubarItem>
  );
}

// --- Menubar Radio Item ---
export interface MenubarRadioItemProps extends MenubarItemProps {
  selected?: boolean;
}

function MenubarRadioItem({
  selected = false,
  children,
  className,
  ...props
}: MenubarRadioItemProps) {
  return (
    <MenubarItem className={cn("pl-9 relative", className)} {...props}>
      <View className="absolute left-2.5 h-4 w-4 items-center justify-center">
        {selected && (
          <Circle
            size={8}
            className="fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-gray-100"
          />
        )}
      </View>
      {children}
    </MenubarItem>
  );
}

// --- Menubar Label ---
export interface MenubarLabelProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  inset?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function MenubarLabel({ inset, className, children, ...props }: MenubarLabelProps) {
  return (
    <View className={cn("px-3 py-1.5", inset && "pl-9", className)} {...props}>
      <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {children}
      </Text>
    </View>
  );
}

// --- Menubar Separator ---
function MenubarSeparator({ className }: { className?: string }) {
  return (
    <View className={cn("h-px bg-gray-100 dark:bg-gray-800 -mx-1.5 my-1", className)} />
  );
}

// --- Menubar Shortcut ---
function MenubarShortcut({
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
function MenubarGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

function MenubarPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function MenubarSub({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

function MenubarSubTrigger({ children }: { children?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-3 py-2.5">
      {children}
      <ChevronRight size={16} className="text-gray-400" />
    </View>
  );
}

function MenubarSubContent({ children }: { children?: React.ReactNode }) {
  return <View className="pl-4">{children}</View>;
}

function MenubarRadioGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

export {
    Menubar, MenubarCheckboxItem, MenubarContent,
    MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarPortal, MenubarRadioGroup,
    MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger
};
