import { ArrowLeft, ArrowRight } from "lucide-react-native";
import * as React from "react";
import {
    Dimensions,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleProp,
    View,
    ViewStyle,
} from "react-native";
import { Button } from "./button";
import { cn } from "./utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Types & Context ---
type Orientation = "horizontal" | "vertical";

interface CarouselContextProps {
  orientation: Orientation;
  scrollRef: React.RefObject<ScrollView | null>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  itemDimension: number;
  setItemDimension: (dim: number) => void;
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

// --- Carousel Root ---
interface CarouselProps extends React.ComponentPropsWithoutRef<typeof View> {
  orientation?: Orientation;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function Carousel({
  orientation = "horizontal",
  className,
  style,
  children,
  ...props
}: CarouselProps) {
  const scrollRef = React.useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [contentDimension, setContentDimension] = React.useState(0);
  const [containerDimension, setContainerDimension] = React.useState(SCREEN_WIDTH);
  const [itemDimension, setItemDimension] = React.useState(SCREEN_WIDTH);

  const canScrollPrev = scrollOffset > 5;
  const canScrollNext = scrollOffset < contentDimension - containerDimension - 5;

  const scrollPrev = React.useCallback(() => {
    if (!scrollRef.current) return;
    const targetOffset = Math.max(0, scrollOffset - itemDimension);
    scrollRef.current.scrollTo({
      [orientation === "horizontal" ? "x" : "y"]: targetOffset,
      animated: true,
    });
  }, [scrollOffset, itemDimension, orientation]);

  const scrollNext = React.useCallback(() => {
    if (!scrollRef.current) return;
    const targetOffset = Math.min(
      contentDimension - containerDimension,
      scrollOffset + itemDimension
    );
    scrollRef.current.scrollTo({
      [orientation === "horizontal" ? "x" : "y"]: targetOffset,
      animated: true,
    });
  }, [scrollOffset, itemDimension, contentDimension, containerDimension, orientation]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isHorizontal = orientation === "horizontal";
    setScrollOffset(isHorizontal ? contentOffset.x : contentOffset.y);
    setContainerDimension(isHorizontal ? layoutMeasurement.width : layoutMeasurement.height);
    setContentDimension(isHorizontal ? contentSize.width : contentSize.height);
  };

  return (
    <CarouselContext.Provider
      value={{
        orientation,
        scrollRef,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        itemDimension,
        setItemDimension,
      }}
    >
      <View
        className={cn("relative w-full", className)}
        style={style}
        {...props}
      >
        {children}
      </View>
    </CarouselContext.Provider>
  );
}

// --- Carousel Content ---
interface CarouselContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function CarouselContent({ className, children, style, ...props }: CarouselContentProps) {
  const { orientation, scrollRef } = useCarousel();
  const isHorizontal = orientation === "horizontal";

  return (
    <ScrollView
      ref={scrollRef}
      horizontal={isHorizontal}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      pagingEnabled={isHorizontal} // 기본 페이징 스와이프 활성화
      decelerationRate="fast"
      scrollEventThrottle={16}
      className="w-full"
    >
      <View
        className={cn(
          isHorizontal ? "flex-row" : "flex-col",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </View>
    </ScrollView>
  );
}

// --- Carousel Item ---
interface CarouselItemProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function CarouselItem({ className, children, style, ...props }: CarouselItemProps) {
  const { setItemDimension, orientation } = useCarousel();

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setItemDimension(orientation === "horizontal" ? width : height);
  };

  return (
    <View
      onLayout={handleLayout}
      className={cn("w-full shrink-0 grow-0", className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// --- Carousel Previous Button ---
function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "absolute z-10 h-9 w-9 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-md border-gray-200 dark:border-gray-800 items-center justify-center",
        orientation === "horizontal"
          ? "top-1/2 left-2 -translate-y-1/2"
          : "top-2 left-1/2 -translate-x-1/2",
        !canScrollPrev && "opacity-40",
        className
      )}
      disabled={!canScrollPrev}
      onPress={scrollPrev}
      {...props}
    >
      <ArrowLeft size={18} className="text-gray-900 dark:text-gray-100" />
    </Button>
  );
}

// --- Carousel Next Button ---
function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "absolute z-10 h-9 w-9 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-md border-gray-200 dark:border-gray-800 items-center justify-center",
        orientation === "horizontal"
          ? "top-1/2 right-2 -translate-y-1/2"
          : "bottom-2 left-1/2 -translate-x-1/2",
        !canScrollNext && "opacity-40",
        className
      )}
      disabled={!canScrollNext}
      onPress={scrollNext}
      {...props}
    >
      <ArrowRight size={18} className="text-gray-900 dark:text-gray-100" />
    </Button>
  );
}

export {
    Carousel,
    CarouselContent,
    CarouselItem, CarouselNext, CarouselPrevious
};
