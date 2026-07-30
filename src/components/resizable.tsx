import { GripHorizontal, GripVertical } from "lucide-react-native";
import * as React from "react";
import {
    LayoutChangeEvent,
    PanResponder,
    StyleProp,
    View,
    ViewStyle,
} from "react-native";
import { cn } from "./utils";

// --- Context ---
type ResizableContextProps = {
  direction: "horizontal" | "vertical";
  panelSizes: number[]; // 각 패널의 flex 비율 (합 = 100)
  updatePanelSize: (index: number, deltaPixels: number) => void;
  registerPanel: (index: number) => void;
  containerSize: number;
};

const ResizableContext = React.createContext<ResizableContextProps | null>(null);

function useResizable() {
  const context = React.useContext(ResizableContext);
  if (!context) {
    throw new Error(
      "Resizable components must be used within <ResizablePanelGroup />"
    );
  }
  return context;
}

// --- ResizablePanelGroup ---
export interface ResizablePanelGroupProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  direction?: "horizontal" | "vertical";
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function ResizablePanelGroup({
  direction = "horizontal",
  className,
  children,
  style,
  onLayout,
  ...props
}: ResizablePanelGroupProps) {
  const [containerSize, setContainerSize] = React.useState(0);
  const [panelSizes, setPanelSizes] = React.useState<number[]>([]);
  const panelCountRef = React.useRef(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    onLayout?.(e);
    const { width, height } = e.nativeEvent.layout;
    setContainerSize(direction === "horizontal" ? width : height);
  };

  const registerPanel = React.useCallback((index: number) => {
    panelCountRef.current = Math.max(panelCountRef.current, index + 1);
    setPanelSizes((prev) => {
      const count = panelCountRef.current;
      const initialFlex = 100 / count;
      return Array(count).fill(initialFlex);
    });
  }, []);

  const updatePanelSize = React.useCallback(
    (handleIndex: number, deltaPixels: number) => {
      if (containerSize <= 0) return;

      const deltaPercent = (deltaPixels / containerSize) * 100;

      setPanelSizes((prev) => {
        if (prev.length <= handleIndex + 1) return prev;
        const next = [...prev];

        // 최소 패널 크기 제한 (10%)
        const minSize = 10;
        const newLeftFlex = next[handleIndex] + deltaPercent;
        const newRightFlex = next[handleIndex + 1] - deltaPercent;

        if (newLeftFlex >= minSize && newRightFlex >= minSize) {
          next[handleIndex] = newLeftFlex;
          next[handleIndex + 1] = newRightFlex;
        }

        return next;
      });
    },
    [containerSize]
  );

  return (
    <ResizableContext.Provider
      value={{
        direction,
        panelSizes,
        updatePanelSize,
        registerPanel,
        containerSize,
      }}
    >
      <View
        onLayout={handleLayout}
        className={cn(
          "flex-1 w-full h-full",
          direction === "horizontal" ? "flex-row" : "flex-col",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </View>
    </ResizableContext.Provider>
  );
}

// --- ResizablePanel ---
export interface ResizablePanelProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  index?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function ResizablePanel({
  index = 0,
  className,
  children,
  style,
  ...props
}: ResizablePanelProps) {
  const { panelSizes, registerPanel } = useResizable();

  React.useEffect(() => {
    registerPanel(index);
  }, [index, registerPanel]);

  const flexValue = panelSizes[index] ?? 50;

  return (
    <View
      className={cn("overflow-hidden", className)}
      style={[{ flex: flexValue }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

// --- ResizableHandle ---
export interface ResizableHandleProps
  extends React.ComponentPropsWithoutRef<typeof View> {
  index?: number; // 조절할 왼쪽/상단 패널 인덱스
  withHandle?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function ResizableHandle({
  index = 0,
  withHandle = false,
  className,
  style,
  ...props
}: ResizableHandleProps) {
  const { direction, updatePanelSize } = useResizable();
  const isHorizontal = direction === "horizontal";

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          const delta = isHorizontal ? gestureState.dx : gestureState.dy;
          updatePanelSize(index, delta);
        },
      }),
    [isHorizontal, index, updatePanelSize]
  );

  return (
    <View
      {...panResponder.panHandlers}
      className={cn(
        "bg-gray-200 dark:bg-gray-800 items-center justify-center z-10",
        isHorizontal ? "w-3 h-full cursor-col-resize" : "h-3 w-full cursor-row-resize",
        className
      )}
      style={style}
      {...props}
    >
      {withHandle && (
        <View className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-0.5 shadow-xs">
          {isHorizontal ? (
            <GripVertical size={12} className="text-gray-500" />
          ) : (
            <GripHorizontal size={12} className="text-gray-500" />
          )}
        </View>
      )}
    </View>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup, useResizable };
