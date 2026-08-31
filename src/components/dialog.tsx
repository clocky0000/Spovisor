import { X } from "lucide-react-native";
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
type DialogContextProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextProps | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a <Dialog />");
  }
  return context;
}

// --- Dialog Root ---
export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isOpen = openProp !== undefined ? openProp : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [openProp, onOpenChange]
  );

  return (
    <DialogContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </DialogContext.Provider>
  );
}

// --- Dialog Trigger ---
export interface DialogTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DialogTrigger({
  className,
  children,
  style,
  onPress,
  ...props
}: DialogTriggerProps) {
  const { onOpenChange } = useDialog();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        onOpenChange(true);
      }}
      className={cn("active:opacity-80", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Dialog Close ---
export interface DialogCloseProps
  extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DialogClose({
  className,
  children,
  style,
  onPress,
  ...props
}: DialogCloseProps) {
  const { onOpenChange } = useDialog();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        onOpenChange(false);
      }}
      className={cn("active:opacity-80", className)}
      style={style}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// --- Dialog Portal / Overlay / Content ---
function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DialogOverlay({ className }: { className?: string }) {
  return (
    <View
      className={cn("absolute inset-0 bg-black/60", className)}
    />
  );
}

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DialogContent({
  className,
  children,
  style,
  ...props
}: DialogContentProps) {
  const { open, onOpenChange } = useDialog();

  if (!open) return null;

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      {/* Background Dim Backdrop */}
      <Pressable
        onPress={() => onOpenChange(false)}
        className="flex-1 bg-black/60 justify-center items-center p-4"
      >
        {/* Modal Card Content */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl relative gap-4",
            className
          )}
          style={style}
          {...props}
        >
          {children}

          {/* Close Button */}
          <Pressable
            onPress={() => onOpenChange(false)}
            hitSlop={8}
            className="absolute top-4 right-4 p-1 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- Dialog Header & Footer ---
function DialogHeader({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View className={cn("flex-col gap-1.5", className)} style={style} {...props}>
      {children}
    </View>
  );
}

function DialogFooter({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View
      className={cn("flex-row justify-end items-center gap-2 pt-2", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Dialog Title & Description ---
function DialogTitle({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

function DialogDescription({
  className,
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text
      className={cn("text-sm text-gray-500 dark:text-gray-400 leading-relaxed", className)}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
    useDialog
};
