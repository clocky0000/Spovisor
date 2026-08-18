import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

export interface AnimatedIconProps {
  name?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  animationType?: "bounce" | "pulse" | "spin";
}

export function AnimatedIcon({
  name = "star",
  size = 24,
  color = "#6366f1",
  style,
  animationType = "bounce",
}: AnimatedIconProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animationType === "bounce") {
      scale.value = withRepeat(
        withSequence(
          withSpring(1.2, { damping: 4 }),
          withSpring(1.0, { damping: 4 })
        ),
        -1,
        true
      );
    } else if (animationType === "pulse") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
    } else if (animationType === "spin") {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    }
  }, [animationType]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}