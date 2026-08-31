import { StyleProp, View, ViewStyle } from "react-native";
import { cn } from "./utils";

export interface ToasterProps {
  theme?: "light" | "dark" | "system";
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
  className?: string;
  style?: StyleProp<ViewStyle>;
  [key: string]: any;
}

const Toaster = ({
  theme = "system",
  position = "bottom-center",
  className,
  style,
  ...props
}: ToasterProps) => {
  const isTop = position.includes("top");
  const alignmentClass = position.includes("left")
    ? "items-start"
    : position.includes("right")
    ? "items-end"
    : "items-center";

  return (
    <View
      className={cn(
        "absolute inset-x-0 z-50 flex px-4 pointer-events-none",
        isTop ? "top-12" : "bottom-12",
        alignmentClass,
        className
      )}
      style={[style, { pointerEvents: 'none' }]}
      {...props}
    >
      {/* 전역 토스트 스토어 또는 컨텍스트와 연동하여 렌더링될 토스트 아이템 영역 */}
    </View>
  );
};

export { Toaster };
