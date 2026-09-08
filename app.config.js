export default {
  expo: {
    name: "spobayzer",
    slug: "spobayzer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "spobayzer",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon",
      bundleIdentifier: "com.spovisor.app" // 👈 네이버 클라우드에 등록할 iOS ID
    },
    android: {
      package: "com.spovisor.app", // 👈 네이버 클라우드에 등록할 안드로이드 ID
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76
        }
      ],
      "expo-font",
      "expo-web-browser",
      "expo-location",
      [
        "@mj-studio/react-native-naver-map",
        {
          // 👈 .env 파일에 있는 키를 몰래 가져와서 주입합니다.
          // 환경변수가 없을 경우를 대비해 빈 문자열 처리
          client_id: process.env.NAVER_MAP_CLIENT_ID || "" 
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};