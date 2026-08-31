import * as React from "react";
import {
    LayoutRectangle,
    Modal,
    Pressable,
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerLayout: LayoutRectangle | null;
  setTriggerLayout: (layout: LayoutRectangle) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within a <Tooltip />");
  }
  return context;
}

/* -------------------------------------------------------------------------- */
/* Tooltip Provider & Root                                                    */
/* -------------------------------------------------------------------------- */

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Tooltip({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [triggerLayout, setTriggerLayout] = React.useState<LayoutRectangle | null>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <TooltipContext.Provider
      value={{
        open: isOpen,
        setOpen: handleOpenChange,
        triggerLayout,
        setTriggerLayout,
      }}
    >
      <View className="relative">{children}</View>
    </TooltipContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* TooltipTrigger                                                             */
/* -------------------------------------------------------------------------- */

export interface TooltipTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function TooltipTrigger({
  children,
  className,
  style,
  onLongPress,
  onPress,
  ...props
}: TooltipTriggerProps) {
  const { setOpen, setTriggerLayout } = useTooltipContext();
  const triggerRef = React.useRef<View>(null);

  const handleLongPress = (e: any) => {
    onLongPress?.(e);
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <Pressable
      ref={triggerRef}
      onLongPress={handleLongPress}
      onPress={onPress}
      className={cn("self-start", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* TooltipContent                                                             */
/* -------------------------------------------------------------------------- */

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function TooltipContent({
  children,
  className,
  textClassName,
  style,
  textStyle,
  ...props
}: TooltipContentProps) {
  const { open, setOpen, triggerLayout } = useTooltipContext();

  if (!open || !triggerLayout) return null;

  // 트리거 요소의 바로 상단 중앙에 툴팁 배치 연산
  const topPosition = Math.max(triggerLayout.y - 40, 10);
  const leftPosition = Math.max(triggerLayout.x + triggerLayout.width / 2 - 60, 10);

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        className="flex-1 bg-transparent"
        onPress={() => setOpen(false)}
      >
        <View
          className={cn(
            "absolute z-50 rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-1.5 shadow-md",
            className
          )}
          style={[
            {
              top: topPosition,
              left: leftPosition,
            },
            style,
          ]}
          {...props}
        >
          {typeof children === "string" || typeof children === "number" ? (
            <Text
              className={cn(
                "text-xs font-medium text-white dark:text-gray-900",
                textClassName
              )}
              style={textStyle}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
