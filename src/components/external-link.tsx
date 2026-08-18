import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Platform } from "react-native";

export interface ExternalLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: string;
}

export function ExternalLink({ href, ...rest }: ExternalLinkProps) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as any}
      onPress={async (event) => {
        if (Platform.OS !== "web") {
          // 웹이 아닌 모바일(iOS/Android) 환경에서는 인앱 브라우저로 엽니다.
          event.preventDefault();
          await WebBrowser.openBrowserAsync(href);
        }
      }}
    />
  );
}