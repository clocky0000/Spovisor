import { Minus } from "lucide-react-native";
import * as React from "react";
import {
    Pressable,
    StyleProp,
    Text,
    TextInput,
    View,
    ViewStyle
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type InputOTPContextProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  isFocused: boolean;
  inputRef: React.RefObject<TextInput | null>;
  disabled?: boolean;
};

const InputOTPContext = React.createContext<InputOTPContextProps | null>(null);

function useInputOTP() {
  const context = React.useContext(InputOTPContext);
  if (!context) {
    throw new Error("InputOTP components must be used within <InputOTP />");
  }
  return context;
}

// --- InputOTP Root ---
export interface InputOTPProps
  extends Omit<React.ComponentPropsWithoutRef<typeof View>, "onChange"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  maxLength: number;
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function InputOTP({
  value: valueProp,
  defaultValue = "",
  onChange,
  maxLength,
  disabled,
  containerClassName,
  className,
  style,
  children,
  ...props
}: InputOTPProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput | null>(null);

  const value = valueProp !== undefined ? valueProp : uncontrolledValue;

  const handleChangeText = (text: string) => {
    const cleaned = text.slice(0, maxLength);
    if (valueProp === undefined) {
      setUncontrolledValue(cleaned);
    }
    onChange?.(cleaned);
  };

  const handlePress = () => {
    if (disabled) return;
    inputRef.current?.focus();
  };

  return (
    <InputOTPContext.Provider
      value={{
        value,
        onChange: handleChangeText,
        maxLength,
        isFocused,
        inputRef,
        disabled,
      }}
    >
      <Pressable
        onPress={handlePress}
        className={cn("relative flex-row items-center", containerClassName)}
        style={style}
        {...props}
      >
        {/* 모바일 OTP 자동 채우기 및 키보드 입력을 위한 투명 숨김 TextInput */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          maxLength={maxLength}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-hidden="true"
          className="absolute w-full h-full opacity-0 z-10"
        />
        <View className={cn("flex-row items-center gap-2", disabled && "opacity-50", className)}>
          {children}
        </View>
      </Pressable>
    </InputOTPContext.Provider>
  );
}

// --- InputOTP Group ---
export interface InputOTPGroupProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function InputOTPGroup({ className, children, style, ...props }: InputOTPGroupProps) {
  return (
    <View className={cn("flex-row items-center", className)} style={style} {...props}>
      {children}
    </View>
  );
}

// --- InputOTP Slot ---
export interface InputOTPSlotProps extends React.ComponentPropsWithoutRef<typeof View> {
  index: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function InputOTPSlot({ index, className, style, ...props }: InputOTPSlotProps) {
  const { value, isFocused, disabled } = useInputOTP();

  const char = value[index] ?? "";
  const isActive = isFocused && (value.length === index || (value.length === index + 1 && index === value.length - 1));
  const hasFakeCaret = isFocused && value.length === index;

  return (
    <View
      className={cn(
        "relative flex items-center justify-center h-12 w-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-base transition-all",
        isActive && "border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 z-10",
        disabled && "bg-gray-100 dark:bg-gray-800",
        className
      )}
      style={style}
      {...props}
    >
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {char}
      </Text>

      {/* 포커스 깜빡임 캐럿(Caret) */}
      {hasFakeCaret && (
        <View className="absolute inset-0 flex items-center justify-center">
          <View className="h-5 w-0.5 bg-gray-900 dark:bg-gray-100" />
        </View>
      )}
    </View>
  );
}

// --- InputOTP Separator ---
function InputOTPSeparator({ className }: { className?: string }) {
  return (
    <View className={cn("px-1 justify-center items-center", className)}>
      <Minus size={16} className="text-gray-400 dark:text-gray-600" />
    </View>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, useInputOTP };
