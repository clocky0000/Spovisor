import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login, saveAuthSession, signup } from '../lib/api';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage('');
  };

  const submit = async () => {
    setErrorMessage('');
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password || (isSignup && !nickname.trim())) {
      setErrorMessage('이메일, 비밀번호와 필수 정보를 입력해주세요.');
      return;
    }
    if (isSignup && password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignup) {
        const auth = await signup(normalizedEmail, password, nickname.trim());
        await saveAuthSession(auth);
      } else {
        const auth = await login(normalizedEmail, password);
        await saveAuthSession(auth);
      }
      router.replace('/');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '요청을 처리하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}><Text style={styles.brandEmoji}>🏆</Text></View>
          <Text style={styles.title}>스포바이저</Text>
          <Text style={styles.subtitle}>경기 관람 전후의 여행을 더 즐겁게</Text>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <Pressable style={[styles.tab, !isSignup && styles.activeTab]} onPress={() => switchMode('login')}>
                <Text style={[styles.tabText, !isSignup && styles.activeTabText]}>로그인</Text>
              </Pressable>
              <Pressable style={[styles.tab, isSignup && styles.activeTab]} onPress={() => switchMode('signup')}>
                <Text style={[styles.tabText, isSignup && styles.activeTabText]}>회원가입</Text>
              </Pressable>
            </View>

            {isSignup && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>닉네임</Text>
                <TextInput value={nickname} onChangeText={setNickname} placeholder="사용할 닉네임" placeholderTextColor="#A1A1AA" style={styles.input} maxLength={50} />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="example@email.com" placeholderTextColor="#A1A1AA" style={styles.input} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder={isSignup ? '8자 이상 입력' : '비밀번호 입력'} placeholderTextColor="#A1A1AA" style={styles.input} secureTextEntry autoCapitalize="none" textContentType="password" />
            </View>

            {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
            <Pressable style={[styles.submitButton, isSubmitting && styles.disabledButton]} onPress={submit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>{isSignup ? '회원가입하기' : '로그인하기'}</Text>}
            </Pressable>
          </View>

          <Text style={styles.apiHint}>API: {process.env.EXPO_PUBLIC_API_URL ?? '로컬 백엔드'}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7FF' },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandMark: { alignSelf: 'center', width: 72, height: 72, borderRadius: 24, backgroundColor: '#5B44E8', alignItems: 'center', justifyContent: 'center' },
  brandEmoji: { fontSize: 36 },
  title: { marginTop: 16, textAlign: 'center', color: '#17142F', fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 6, textAlign: 'center', color: '#71717A', fontSize: 13 },
  card: { marginTop: 28, padding: 20, borderRadius: 24, backgroundColor: '#FFFFFF', boxShadow: '0px 8px 16px rgba(49, 46, 129, 0.08)', elevation: 3 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#F4F4F5', marginBottom: 22 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#5B44E8' },
  tabText: { color: '#71717A', fontWeight: '700' },
  activeTabText: { color: '#FFFFFF' },
  fieldGroup: { marginBottom: 16 },
  label: { marginBottom: 8, color: '#27233F', fontSize: 13, fontWeight: '800' },
  input: { height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E4E4E7', borderRadius: 12, color: '#18181B', backgroundColor: '#FFFFFF' },
  error: { marginBottom: 14, color: '#DC2626', fontSize: 12, lineHeight: 18 },
  submitButton: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5B44E8' },
  disabledButton: { opacity: 0.65 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  apiHint: { marginTop: 18, textAlign: 'center', color: '#A1A1AA', fontSize: 11 },
});
