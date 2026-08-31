import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";

export interface HintRowProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function HintRow({
  title,
  description,
  children,
  style,
}: HintRowProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <ThemedText type="defaultSemiBold">{title}</ThemedText>}
      {description && (
        <ThemedText style={styles.description}>{description}</ThemedText>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
  },
});