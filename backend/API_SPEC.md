# Spovisor 백엔드 기능 및 API 명세

## 1. 기본 정보

- Base URL: `http://localhost:8080/api`
- Content-Type: `application/json`
- 인증이 필요한 API: `Authorization: Bearer {accessToken}`
- 데이터베이스: PostgreSQL
- 인증 방식: JWT, 기본 만료 시간 24시간

## 2. 백엔드 담당 기능

현재 백엔드는 다음 기능을 담당한다.

1. 회원가입·로그인·JWT 발급
2. 내 프로필 조회·수정·회원탈퇴
3. 비밀번호 변경
4. 사용자 설문 저장·조회
5. 실제 장소 데이터 검색 및 선택 결과 반환
6. 저장 코스 저장·조회·삭제
7. 경기 관람 여행 기록 및 방문 장소·평점 저장
8. AI 추천 요청 원본 설문 저장

현재 백엔드는 AI 벡터 생성, 관광공사 API 호출, 추천 코스 계산을 직접 수행하지 않는다. AI 서버가 완성되면 추천 요청의 `requestId`를 기준으로 결과를 연결하면 된다.

## 3. 인증 API

### 회원가입

`POST /auth/signup` — 인증 불필요, `201 Created`

요청:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동"
}
```

응답:

```json
{
  "accessToken": "jwt-token",
  "userId": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "mascot": "trophy",
  "themeColor": "#5B44E8"
}
```

조건: 이메일 형식, 비밀번호 8~100자, 닉네임 1~50자. 이미 가입된 이메일은 `409 EMAIL_ALREADY_EXISTS`.

### 로그인

`POST /auth/login` — 인증 불필요, `200 OK`

요청:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

응답 형식은 회원가입과 같다. 이메일 또는 비밀번호가 틀리면 `401 INVALID_CREDENTIALS`.

## 4. 사용자 API

모든 사용자 API는 인증이 필요하다.

### 내 프로필 조회

`GET /users/me` — `200 OK`

응답:

```json
{
  "userId": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "mascot": "trophy",
  "themeColor": "#5B44E8",
  "createdAt": "2026-08-27T12:00:00"
}
```

### 내 프로필 수정

`PATCH /users/me` — `200 OK`

요청 필드는 선택 사항이다.

```json
{
  "nickname": "새닉네임",
  "mascot": "bear",
  "themeColor": "#10B981"
}
```

응답은 프로필 조회와 같다. `themeColor`는 `#RRGGBB` 형식이다.

### 비밀번호 변경

`PATCH /users/me/password` — `204 No Content`

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

현재 비밀번호가 틀리면 `401`, 새 비밀번호가 8자 미만이면 `400`.

### 회원탈퇴

`DELETE /users/me` — `204 No Content`

회원과 연결된 설문, 저장 코스, 여행 기록, 추천 요청도 함께 삭제된다.

## 5. 설문 API

### 설문 저장

`POST /user/survey` 또는 `PUT /user/survey` — `200 OK`

`PUT`은 사용자의 마지막 설문을 새 내용으로 덮어쓴다.

```json
{
  "survey": {
    "stadium": "수원 KT위즈파크",
    "gameDate": "2026-06-29",
    "gameStartTime": "18:30",
    "arrivalTime": "1시간 전",
    "travelTiming": "경기 전",
    "origin": "현재 위치",
    "originCoordinates": {
      "latitude": 37.2636,
      "longitude": 127.0286
    },
    "transport": "대중교통",
    "maxTravelTime": "1시간",
    "walkingDistance": "20분 이하",
    "companion": "친구와 여행",
    "extraCompanion": ["고령자 동반"],
    "concept": "미식 탐방형",
    "extras": ["실내 선호", "혼잡 피하기"],
    "fixedPlaces": [
      {
        "contentId": "spot-content-id",
        "name": "스타필드/수원",
        "category": "쇼핑",
        "latitude": 37.287375,
        "longitude": 126.990839
      }
    ],
    "excludedConditions": ["야외 장소 제외"]
  }
}
```

응답:

```json
{
  "survey": { "...": "저장된 설문 객체" },
  "updatedAt": "2026-08-27T12:00:00"
}
```

### 설문 조회

`GET /user/survey` — `200 OK`

설문이 없으면 `{ "survey": null, "updatedAt": null }`을 반환한다.

## 6. 장소 검색 API

### 장소명 검색

`GET /spots/search?q={검색어}` — 인증 필요, `200 OK`

검색어는 두 글자 이상이어야 하며 최대 20건을 반환한다. 현재 `spot_cache`에 저장된 관광공사 장소 데이터와 좌표를 사용한다.

예시: `GET /spots/search?q=수원`

응답:

```json
[
  {
    "contentId": "spot-content-id",
    "name": "스타필드/수원",
    "category": "쇼핑",
    "areaCode": "41",
    "sigunguCode": "117",
    "longitude": 126.990839,
    "latitude": 37.287375
  }
]
```

## 7. 저장 코스 API

### 저장 코스 목록

`GET /courses/saved` — `200 OK`

응답:

```json
[
  {
    "id": 1,
    "title": "A코스",
    "stadium": "수원 KT위즈파크",
    "courseType": "미식 중심",
    "course": { "코스 전체 JSON": "..." },
    "savedAt": "2026-08-27T12:00:00"
  }
]
```

### 코스 저장

`POST /courses/saved` — `201 Created`

```json
{
  "title": "A코스",
  "stadium": "수원 KT위즈파크",
  "courseType": "미식 중심",
  "course": { "코스 전체 JSON": "..." }
}
```

응답은 저장된 코스 객체다.

### 저장 코스 삭제

`DELETE /courses/saved/{courseId}` — `204 No Content`

## 8. 여행 기록 API

### 여행 기록 목록

`GET /trips` — `200 OK`

### 여행 기록 생성

`POST /trips` — `201 Created`

```json
{
  "stadium": "수원 KT위즈파크",
  "matchName": "kt vs NC",
  "tripDate": "2026-06-29",
  "courseTitle": "A코스"
}
```

`stadium`은 필수이며 `tripDate`는 `yyyy-MM-dd` 형식이다.

### 여행 평점 및 방문 장소 저장

`PATCH /trips/{tripId}/feedback` — `200 OK`

```json
{
  "rating": 5,
  "visitedSpotIds": [102, 103, 105]
}
```

`rating`은 1~5 사이의 정수다.

응답 예시:

```json
{
  "id": 1,
  "stadium": "수원 KT위즈파크",
  "matchName": "kt vs NC",
  "tripDate": "2026-06-29",
  "courseTitle": "A코스",
  "rating": 5,
  "visitedSpotIds": [102, 103, 105],
  "createdAt": "2026-08-27T12:00:00"
}
```

## 9. AI 추천 연동 준비 API

### 추천 요청 원본 저장

`POST /recommendations/requests` — `201 Created`

```json
{
  "survey": {
    "stadium": "수원 KT위즈파크",
    "concept": "미식 탐방형",
    "fixedPlaces": []
  }
}
```

응답:

```json
{
  "requestId": 1,
  "status": "PENDING",
  "createdAt": "2026-08-27T12:00:00"
}
```

### 추천 요청 상태 조회

`GET /recommendations/requests/{requestId}` — `200 OK`

현재 저장된 상태는 `PENDING`이며, 아직 AI 서버를 호출하거나 추천 결과를 반환하지 않는다.

## 10. 공통 오류 형식

```json
{
  "code": "INVALID_REQUEST",
  "message": "입력값을 확인해주세요."
}
```

- `400 INVALID_REQUEST`: 필수값·형식·검색어 오류
- `401 INVALID_CREDENTIALS`: 로그인 또는 비밀번호 인증 실패
- `403`: 인증 토큰이 없거나 유효하지 않은 보호 API 접근
- `404` 성격의 리소스 오류: 현재 구현에서는 `INVALID_REQUEST`로 반환될 수 있음
- `409 EMAIL_ALREADY_EXISTS`: 이미 가입된 이메일
