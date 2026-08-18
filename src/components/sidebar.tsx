import { PanelLeft } from "lucide-react-native";
import * as React from "react";
import {
    Pressable,
    StyleProp,
    Text,
    View,
    ViewStyle
} from "react-native";
import { Sheet, SheetContent } from "./sheet";
import { cn } from "./utils";

// --- Types & Context ---
type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a <SidebarProvider />");
  }
  return context;
}

// --- SidebarProvider ---
export interface SidebarProviderProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function SidebarProvider({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        setUncontrolledOpen(openState);
      }
    },
    [setOpenProp, open]
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, [setOpen]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      toggleSidebar,
    }),
    [state, open, setOpen, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <View className={cn("flex-1 w-full", className)} style={style} {...props}>
        {children}
      </View>
    </SidebarContext.Provider>
  );
}

// --- Sidebar ---
export interface SidebarProps {
  side?: "left" | "right";
  className?: string;
  children?: React.ReactNode;
}

function Sidebar({ side = "left", className, children }: SidebarProps) {
  const { open, setOpen } = useSidebar();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={side}
        className={cn(
          "bg-gray-900 dark:bg-gray-950 p-0 border-r-0 border-l-0",
          className
        )}
      >
        <View className="flex-1 w-full flex-col">{children}</View>
      </SheetContent>
    </Sheet>
  );
}

// --- SidebarTrigger ---
export interface SidebarTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
}

function SidebarTrigger({ className, onPress, ...props }: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Toggle Sidebar"
      onPress={(e) => {
        onPress?.(e);
        toggleSidebar();
      }}
      className={cn(
        "p-2 rounded-lg items-center justify-center active:bg-gray-100 dark:active:bg-gray-800",
        className
      )}
      {...props}
    >
      <PanelLeft size={20} className="text-gray-700 dark:text-gray-300" />
    </Pressable>
  );
}

// --- Structural Subcomponents ---
function SidebarHeader({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("flex-col gap-2 p-4 border-b border-gray-800", className)} {...props}>
      {children}
    </View>
  );
}

function SidebarFooter({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("flex-col gap-2 p-4 mt-auto border-t border-gray-800", className)} {...props}>
      {children}
    </View>
  );
}

function SidebarContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("flex-1 p-2 gap-1", className)} {...props}>
      {children}
    </View>
  );
}

function SidebarGroup({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("relative flex-col w-full py-2", className)} {...props}>
      {children}
    </View>
  );
}

function SidebarGroupLabel({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

function SidebarGroupContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("w-full flex-col gap-1", className)} {...props}>
      {children}
    </View>
  );
}

function SidebarMenu({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("w-full flex-col gap-1", className)} {...props}>
      {children}
    </View>
  );
}

function SidebarMenuItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("relative w-full", className)} {...props}>
      {children}
    </View>
  );
}

// --- Menu Button ---
export interface SidebarMenuButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  isActive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function SidebarMenuButton({
  isActive = false,
  className,
  children,
  onPress,
  ...props
}: SidebarMenuButtonProps) {
  const { setOpen } = useSidebar();

  const handlePress = (e: any) => {
    onPress?.(e);
    // 메뉴 아이템 클릭 시 필요에 따라 사이드바를 닫을 수 있음
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={handlePress}
      className={cn(
        "flex-row items-center gap-3 w-full px-3 py-2.5 rounded-xl active:bg-gray-800 transition-all",
        isActive && "bg-gray-800 text-white font-medium",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-base text-gray-300 dark:text-gray-200 font-medium",
            isActive && "text-white font-semibold"
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

function SidebarInset({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("flex-1 bg-white dark:bg-gray-950", className)} {...props}>
      {children}
    </View>
  );
}

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar
};
