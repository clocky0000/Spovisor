import { Platform, StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";

export interface WebBadgeProps {
  label?: string;
}

export function WebBadge({ label = "Web" }: WebBadgeProps) {
  if (Platform.OS !== "web") return null;

  return (
    <View style={styles.badge}>
      <ThemedText style={styles.text}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});