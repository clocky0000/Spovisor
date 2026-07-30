import { useWindowDimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // react-native의 useWindowDimensions는 기기 화면 너비를 실시간으로 감지합니다.
  const { width } = useWindowDimensions();

  // 현재 화면 너비가 브레이크포인트보다 작은지 여부를 반환합니다.
  return width < MOBILE_BREAKPOINT;
}