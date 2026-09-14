const releaseProfiles = new Set(["preview", "production"]);
const isReleaseBuild = releaseProfiles.has(process.env.EAS_BUILD_PROFILE || "");
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "").trim();
const naverMapClientId = (process.env.NAVER_MAP_CLIENT_ID || "").trim();

if (isReleaseBuild && !/^https:\/\//i.test(apiUrl)) {
  throw new Error("Release builds require EXPO_PUBLIC_API_URL to be a public HTTPS URL.");
}

if (isReleaseBuild && !naverMapClientId) {
  throw new Error("Release builds require NAVER_MAP_CLIENT_ID.");
}

export default {
  expo: {
    name: "스포바이저",
    slug: "spovisor",
    description: "스포츠 경기 관람 전후의 맞춤 여행 코스를 추천하고 기록하는 서비스",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "spovisor",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon",
      bundleIdentifier: "com.spovisor.app" // 👈 네이버 클라우드에 등록할 iOS ID
    },
    android: {
      package: "com.spovisor.app",
      versionCode: 1,
      allowBackup: false,
      permissions: ["android.permission.INTERNET"],
      blockedPermissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.VIBRATE"
      ],
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
      "expo-image",
      "expo-secure-store",
      "expo-status-bar",
      "expo-web-browser",
      [
        "@mj-studio/react-native-naver-map",
        {
          client_id: naverMapClientId
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: ["https://repository.map.naver.com/archive/maven"],
            usesCleartextTraffic: false
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};
