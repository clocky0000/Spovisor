import { Image, ImageProps } from 'expo-image';
import { useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

// 로딩 실패 시 노출할 SVG 기본 에러 아이콘 Data URI
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

export interface ImageWithFallbackProps extends Omit<ImageProps, 'style'> {
  className?: string;
  style?: StyleProp<ImageStyle>;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { source, style, className, contentFit = 'cover', ...rest } = props;

  // 이미지를 불러올 수 없거나 에러가 발생한 경우 (Fallback)
  if (didError || !source) {
    return (
      <View
        className={`bg-gray-100 items-center justify-center overflow-hidden ${className ?? ''}`}
        style={style as StyleProp<ViewStyle>}
      >
        <Image
          source={{ uri: ERROR_IMG_SRC }}
          style={styles.errorIcon}
          contentFit="contain"
        />
      </View>
    );
  }

  // 정상적으로 이미지를 출력하는 경우
  return (
    <Image
      source={source}
      style={style}
      className={className}
      contentFit={contentFit}
      onError={handleError}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  errorIcon: {
    width: 40,
    height: 40,
    opacity: 0.4,
  },
});