import { Image, ImageProps } from "expo-image";
import * as React from "react";
import { ImageStyle, StyleProp, Text, View, ViewStyle } from "react-native";
import { cn } from "./utils";

// --- Context for Image Loading State ---
interface AvatarContextType {
  hasError: boolean;
  setHasError: (error: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AvatarContext = React.createContext<AvatarContextType | null>(null);

const useAvatar = () => {
  const context = React.useContext(AvatarContext);
  if (!context) {
    throw new Error("Avatar components must be used within an Avatar");
  }
  return context;
};

// --- Avatar Root ---
interface AvatarProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function Avatar({ className, style, children, ...props }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <AvatarContext.Provider
      value={{ hasError, setHasError, isLoading, setIsLoading }}
    >
      <View
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </View>
    </AvatarContext.Provider>
  );
}

// --- Avatar Image ---
interface AvatarImageProps extends Omit<ImageProps, "style"> {
  className?: string;
  style?: StyleProp<ImageStyle>;
}

function AvatarImage({
  className,
  style,
  source,
  contentFit = "cover",
  ...props
}: AvatarImageProps) {
  const { hasError, setHasError, setIsLoading } = useAvatar();

  if (hasError || !source) {
    return null;
  }

  return (
    <Image
      source={source}
      contentFit={contentFit}
      onLoadStart={() => setIsLoading(true)}
      onLoadEnd={() => setIsLoading(false)}
      onError={() => {
        setHasError(true);
        setIsLoading(false);
      }}
      className={cn("aspect-square h-full w-full", className)}
      style={style}
      {...props}
    />
  );
}

// --- Avatar Fallback ---
interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function AvatarFallback({
  className,
  style,
  children,
  ...props
}: AvatarFallbackProps) {
  const { hasError, isLoading } = useAvatar();

  // 이미지가 정상 로드 중이거나 로드에 성공했으면 Fallback을 숨깁니다.
  if (!hasError && !isLoading) {
    return null;
  }

  return (
    <View
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700",
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
