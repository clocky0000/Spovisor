import { useColorScheme, View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor =
    colorScheme === "dark"
      ? darkColor ?? "#111827"
      : lightColor ?? "#ffffff";

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}