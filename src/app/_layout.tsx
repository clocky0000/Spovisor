import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  useFonts,
} from "@expo-google-fonts/noto-sans-kr";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import "../global.css";

// 폰트 로딩 중 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack
      initialRouteName="auth"
      screenOptions={{
        headerShown: false,
        // SDK 56 호환: NativeWind 또는 style 기반 테마 분기
        contentStyle: {
          backgroundColor: colorScheme === "dark" ? "#111827" : "#ffffff",
        },
      }}
    >
      <Stack.Screen name="auth" />
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
