import { ChevronDown } from "lucide-react-native";
import * as React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    withTiming
} from "react-native-reanimated";

// --- Context & Types ---
interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

const useAccordion = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
};

interface AccordionProps {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

// --- Accordion Root ---
function Accordion({ type = "single", defaultValue, children, className = "" }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleItem = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        if (type === "single") {
          return prev.includes(value) ? [] : [value];
        } else {
          return prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value];
        }
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <View className={`w-full ${className}`}>{children}</View>
    </AccordionContext.Provider>
  );
}

// --- Accordion Item ---
interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const ItemContext = React.createContext<{ value: string; isOpen: boolean }>({
  value: "",
  isOpen: false,
});

function AccordionItem({ value, children, className = "" }: AccordionItemProps) {
  const { openItems } = useAccordion();
  const isOpen = openItems.includes(value);

  return (
    <ItemContext.Provider value={{ value, isOpen }}>
      <View className={`border-b border-gray-200 dark:border-gray-800 ${className}`}>
        {children}
      </View>
    </ItemContext.Provider>
  );
}

// --- Accordion Trigger ---
interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className = "" }: AccordionTriggerProps) {
  const { toggleItem } = useAccordion();
  const { value, isOpen } = React.useContext(ItemContext);

  // 화살표 회전 애니메이션
  const rotation = useDerivedValue(() => {
    return withTiming(isOpen ? 180 : 0, { duration: 200 });
  });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPress={() => toggleItem(value)}
      className={`flex-row items-center justify-between py-4 ${className}`}
    >
      {typeof children === "string" ? (
        <Text className="text-sm font-medium text-black dark:text-white flex-1 mr-2">
          {children}
        </Text>
      ) : (
        <View className="flex-1 mr-2">{children}</View>
      )}
      <Animated.View style={iconStyle}>
        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
      </Animated.View>
    </Pressable>
  );
}

// --- Accordion Content ---
interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionContent({ children, className = "" }: AccordionContentProps) {
  const { isOpen } = React.useContext(ItemContext);
  const [contentHeight, setContentHeight] = React.useState(0);

  // 높이 가변 애니메이션
  const heightValue = useDerivedValue(() => {
    return withTiming(isOpen ? contentHeight : 0, { duration: 250 });
  });

  const animStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
    opacity: withTiming(isOpen ? 1 : 0, { duration: 200 }),
    overflow: "hidden",
  }));

  return (
    <Animated.View style={animStyle}>
      <View
        onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
        className={`pb-4 pt-0 ${className}`}
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        {typeof children === "string" ? (
          <Text className="text-sm text-gray-600 dark:text-gray-300">{children}</Text>
        ) : (
          children
        )}
      </View>
    </Animated.View>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
