import * as React from "react";
import {
    Modal,
    Pressable,
    StyleProp,
    Text,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

// --- Context ---
interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | null>(null);

const useAlertDialog = () => {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialog components must be used within an AlertDialog");
  }
  return context;
};

// --- Root ---
interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

function AlertDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// --- Trigger ---
interface AlertDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

function AlertDialogTrigger({ children, className }: AlertDialogTriggerProps) {
  const { setOpen } = useAlertDialog();

  return (
    <Pressable onPress={() => setOpen(true)} className={className}>
      {typeof children === "string" ? (
        <Text className="text-base font-medium">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// --- Portal & Overlay (React Native Modal 내부에서 통합 관리) ---
function AlertDialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AlertDialogOverlay({ className }: { className?: string }) {
  return (
    <View
      className={cn(
        "absolute inset-0 bg-black/50 justify-center items-center p-4",
        className
      )}
    />
  );
}

// --- Content ---
interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function AlertDialogContent({ children, className, style }: AlertDialogContentProps) {
  const { open, setOpen } = useAlertDialog();

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              className={cn(
                "bg-white dark:bg-gray-900 w-full max-w-sm p-6 rounded-2xl gap-4 shadow-xl border border-gray-100 dark:border-gray-800",
                className
              )}
              style={style}
            >
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// --- Header, Footer, Title, Description ---
function AlertDialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <View className={cn("flex-col gap-2 text-center sm:text-left", className)}>{children}</View>;
}

function AlertDialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={cn("flex-col-reverse sm:flex-row gap-2 justify-end mt-2", className)}>
      {children}
    </View>
  );
}

function AlertDialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text className={cn("text-lg font-semibold text-gray-900 dark:text-gray-100", className)}>
      {children}
    </Text>
  );
}

function AlertDialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>
      {children}
    </Text>
  );
}

// --- Action & Cancel ---
interface AlertDialogActionProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

function AlertDialogAction({ children, onPress, className }: AlertDialogActionProps) {
  const { setOpen } = useAlertDialog();

  const handlePress = () => {
    onPress?.();
    setOpen(false);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "bg-black dark:bg-white py-3 px-4 rounded-xl items-center justify-center",
        className
      )}
    >
      {typeof children === "string" ? (
        <Text className="text-white dark:text-black font-semibold text-sm">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

function AlertDialogCancel({ children, onPress, className }: AlertDialogActionProps) {
  const { setOpen } = useAlertDialog();

  const handlePress = () => {
    onPress?.();
    setOpen(false);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "border border-gray-200 dark:border-gray-800 bg-transparent py-3 px-4 rounded-xl items-center justify-center",
        className
      )}
    >
      {typeof children === "string" ? (
        <Text className="text-gray-900 dark:text-gray-100 font-semibold text-sm">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export {
    AlertDialog, AlertDialogAction,
    AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger
};
