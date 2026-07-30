// src/components/StepIndicator.tsx
import { StyleSheet, View } from 'react-native';

interface StepIndicatorProps {
  current: number;
  totalSteps?: number;
}

export function StepIndicator({ current, totalSteps = 5 }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        return (
          <View
            key={step}
            style={[
              styles.dot,
              step === current ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#5B44E8',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#E2E8F0',
  },
});