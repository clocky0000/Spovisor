import { Search } from "lucide-react-native";
import * as React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleProp,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type CommandContextProps = {
  search: string;
  setSearch: (value: string) => void;
};

const CommandContext = React.createContext<CommandContextProps | null>(null);

function useCommand() {
  const context = React.useContext(CommandContext);
  if (!context) {
    throw new Error("Command components must be used within a <Command />");
  }
  return context;
}

// --- Command Root ---
export interface CommandProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function Command({ className, children, style, ...props }: CommandProps) {
  const [search, setSearch] = React.useState("");

  return (
    <CommandContext.Provider value={{ search, setSearch }}>
      <View
        className={cn(
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex-col w-full",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </View>
    </CommandContext.Provider>
  );
}

// --- Command Dialog (Modal) ---
export interface CommandDialogProps {
  visible?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

function CommandDialog({ visible = false, onClose, children }: CommandDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center p-4"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Command className="shadow-2xl">{children}</Command>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- Command Input ---
export interface CommandInputProps extends TextInputProps {
  className?: string;
}

function CommandInput({ className, value, onChangeText, ...props }: CommandInputProps) {
  const { search, setSearch } = useCommand();

  const handleTextChange = (text: string) => {
    setSearch(text);
    onChangeText?.(text);
  };

  return (
    <View className="flex-row items-center px-4 border-b border-gray-100 dark:border-gray-800 h-14 gap-3">
      <Search size={18} className="text-gray-400 dark:text-gray-500" />
      <TextInput
        value={value ?? search}
        onChangeText={handleTextChange}
        placeholder="명령어 검색..."
        placeholderTextColor="#9ca3af"
        className={cn(
          "flex-1 text-base text-gray-900 dark:text-gray-100 h-full",
          className
        )}
        {...props}
      />
    </View>
  );
}

// --- Command List ---
export interface CommandListProps extends React.ComponentPropsWithoutRef<typeof ScrollView> {
  className?: string;
}

function CommandList({ className, children, ...props }: CommandListProps) {
  return (
    <ScrollView
      className={cn("max-h-72 p-2", className)}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

// --- Command Empty ---
export interface CommandEmptyProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  children?: React.ReactNode;
}

function CommandEmpty({ className, children = "검색 결과가 없습니다.", ...props }: CommandEmptyProps) {
  const { search } = useCommand();

  // 검색어가 없으면 표시 안 함 (리스트 항목이 없을 때 기본 노출용)
  if (!search) return null;

  return (
    <View className={cn("py-6 items-center justify-center", className)} {...props}>
      <Text className="text-sm text-gray-400 dark:text-gray-500">{children}</Text>
    </View>
  );
}

// --- Command Group ---
export interface CommandGroupProps extends React.ComponentPropsWithoutRef<typeof View> {
  heading?: string;
  className?: string;
}

function CommandGroup({ heading, className, children, ...props }: CommandGroupProps) {
  return (
    <View className={cn("mb-2", className)} {...props}>
      {heading && (
        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 py-1.5 uppercase tracking-wider">
          {heading}
        </Text>
      )}
      {children}
    </View>
  );
}

// --- Command Separator ---
function CommandSeparator({ className }: { className?: string }) {
  return <View className={cn("h-px bg-gray-100 dark:bg-gray-800 -mx-2 my-1", className)} />;
}

// --- Command Item ---
export interface CommandItemProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function CommandItem({
  onSelect,
  disabled = false,
  className,
  children,
  ...props
}: CommandItemProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onSelect}
      className={cn(
        "flex-row items-center px-3 py-2.5 rounded-xl gap-3 active:bg-gray-100 dark:active:bg-gray-800 transition-all",
        disabled && "opacity-50",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className="text-sm text-gray-800 dark:text-gray-200 font-medium flex-1">
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// --- Command Shortcut ---
function CommandShortcut({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <Text className={cn("ml-auto text-xs text-gray-400 dark:text-gray-500 tracking-widest", className)}>
      {children}
    </Text>
  );
}

export {
    Command,
    CommandDialog, CommandEmpty,
    CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut
};
