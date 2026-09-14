# 스포바이저 ONE store 릴리스

## 빌드 전 필수값

1. `.env.production.example`을 참고해 EAS의 production 환경에 `EXPO_PUBLIC_API_URL`과 `NAVER_MAP_CLIENT_ID`를 등록합니다.
2. API URL은 외부 심사 단말에서 접근 가능한 HTTPS 주소이며 `/api`까지 포함해야 합니다.
3. 네이버 지도 콘솔의 Android 앱 패키지를 `com.spovisor.app`으로 등록합니다.
4. 개인정보 처리방침 공개 URL은 운영 백엔드의 `https://<API 도메인>/privacy.html`, 이용약관은 `/terms.html`입니다.

```powershell
$env:EXPO_PUBLIC_API_URL='https://api.your-domain.example/api'
$env:NAVER_MAP_CLIENT_ID='실제-클라이언트-ID'
npm run release:verify
npm run typecheck
npx expo-doctor
npx eas-cli build --platform android --profile production
```

`preview`와 `production` 프로필은 HTTP API 또는 누락된 네이버 지도 ID를 허용하지 않습니다. EAS production은 AAB를 만들고 EAS credentials로 서명합니다. 로컬 Gradle 릴리스 빌드는 다음 네 환경변수가 모두 없으면 중단됩니다.

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## ONEconsole 입력 초안

- 상품명: `스포바이저 (Spovisor)`
- 한줄 설명: `스포츠 경기 전후, 취향에 맞는 여행 코스를 추천하고 일정과 방문 기록을 관리합니다.`
- 카테고리: 생활/위치 우선 검토
- 패키지명: `com.spovisor.app`
- 광고: 사용 안 함
- 유료 앱/인앱상품: 사용 안 함
- 외부결제: 사용 안 함
- 배포 국가: 대한민국
- 배포 옵션: 심사 승인 후 수동 배포
- 고객지원: `somedaym77@gmail.com`

## 사람이 확정해야 하는 항목

- 운영자/사업자 정확한 명칭, 주소, 전화번호
- 운영 클라우드와 AI 제공자의 회사명·처리 국가·위탁 업무·보유기간
- 위치성 정보 신고 여부에 대한 ONE store Help의 서면 답변
- 팀명, 경기 일정, 관광 데이터와 이미지의 사용 근거
- 실제 앱에서 캡처한 스크린샷 2~8장
- 심사 전용 계정과 심사 기간에 존재하는 테스트 경기

위 항목을 확정한 뒤 앱 내 정책, 백엔드 공개 HTML, ONEconsole 데이터 공개 입력을 동일하게 갱신합니다.
