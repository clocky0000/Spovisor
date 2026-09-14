import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

const readText = (path) => {
  const absolutePath = resolve(root, path);
  if (!existsSync(absolutePath)) {
    errors.push(`Required file is missing: ${path}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
};

const readJson = (path) => {
  const text = readText(path);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    errors.push(`Invalid JSON: ${path}`);
    return {};
  }
};

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "").trim();
const naverMapClientId = (process.env.NAVER_MAP_CLIENT_ID || "").trim();

try {
  const parsed = new URL(apiUrl);
  if (parsed.protocol !== "https:") errors.push("EXPO_PUBLIC_API_URL must use HTTPS.");
  if (
    parsed.hostname === "localhost"
    || parsed.hostname.endsWith(".test")
    || parsed.hostname.endsWith(".example")
    || parsed.hostname.endsWith("example.com")
  ) {
    errors.push("EXPO_PUBLIC_API_URL still uses a local or reserved example domain.");
  }
  if (!parsed.pathname.replace(/\/+$/, "").endsWith("/api")) {
    errors.push("EXPO_PUBLIC_API_URL must include the /api base path.");
  }
} catch {
  errors.push("EXPO_PUBLIC_API_URL must be a valid public URL.");
}

if (!naverMapClientId || /(replace|placeholder|example|dummy|test[-_])/i.test(naverMapClientId)) {
  errors.push("NAVER_MAP_CLIENT_ID must contain the real production Android client ID.");
}

const appConfig = readText("app.config.js");
const packageJson = readJson("package.json");
const easJson = readJson("eas.json");

const requiredConfigFragments = [
  ["Android package", 'package: "com.spovisor.app"'],
  ["release profile guard", "releaseProfiles.has"],
  ["cleartext traffic disabled", "usesCleartextTraffic: false"],
  ["Android backup disabled", "allowBackup: false"],
  ["internet permission", '"android.permission.INTERNET"'],
  ["external storage permission block", '"android.permission.READ_EXTERNAL_STORAGE"'],
  ["overlay permission block", '"android.permission.SYSTEM_ALERT_WINDOW"'],
];

for (const [label, fragment] of requiredConfigFragments) {
  if (!appConfig.includes(fragment)) errors.push(`app.config.js is missing: ${label}.`);
}

const requiredPlugins = [
  "expo-router",
  "expo-splash-screen",
  "expo-font",
  "expo-image",
  "expo-secure-store",
  "expo-status-bar",
  "expo-web-browser",
  "@mj-studio/react-native-naver-map",
  "expo-build-properties",
];

for (const plugin of requiredPlugins) {
  if (!appConfig.includes(`"${plugin}"`)) {
    errors.push(`Expo plugin is not registered: ${plugin}.`);
  }
  if (!(plugin in (packageJson.dependencies || {}))) {
    errors.push(`Expo plugin dependency is missing: ${plugin}.`);
  }
}

const versionCodeMatch = appConfig.match(/versionCode:\s*(\d+)/);
if (!versionCodeMatch || Number(versionCodeMatch[1]) < 1) {
  errors.push("Android versionCode must be a positive integer.");
}

if (easJson?.build?.production?.android?.buildType !== "app-bundle") {
  errors.push("eas.json production Android build must use app-bundle (AAB).");
}

if (packageJson?.scripts?.["release:verify"] !== "node ./scripts/verify-release.mjs") {
  errors.push("package.json release:verify script is missing or changed.");
}

[
  "src/app/privacy.tsx",
  "src/app/terms.tsx",
  "src/components/LegalDocumentScreen.tsx",
  "src/lib/legal.ts",
  ".env.production.example",
  "ONESTORE_RELEASE.md",
].forEach(readText);

if (existsSync(resolve(root, ".env"))) {
  warnings.push("A local .env exists. Confirm it stays ignored and is never included in the handoff archive.");
}

if (warnings.length) {
  console.warn("Release verification warnings:\n- " + warnings.join("\n- "));
}

if (errors.length) {
  console.error("Release verification failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log("Release environment and code configuration are valid.");
