import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type LegalSection = { title: string; paragraphs: string[] };

export function LegalDocumentScreen({ title, effectiveDate, sections }: {
  title: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.effectiveDate}>시행일: {effectiveDate}</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ECECF2', paddingHorizontal: 12 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#292443', fontSize: 36, lineHeight: 40 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#17142F', fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 44 },
  content: { padding: 22, paddingBottom: 48 },
  effectiveDate: { color: '#71717A', fontSize: 12, marginBottom: 22 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#27233F', fontSize: 16, fontWeight: '800', marginBottom: 9 },
  paragraph: { color: '#52525B', fontSize: 14, lineHeight: 22, marginBottom: 8 },
});
