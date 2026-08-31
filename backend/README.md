# Spovisor backend

Spring Boot + PostgreSQL + Flyway 기반의 로그인/회원가입 백엔드입니다.

## Docker로 실행하기

저장소 루트에서 실행합니다.

```bash
docker compose up --build
```

실행 구성은 다음과 같습니다.

- PostgreSQL: `localhost:55432`
- Spring Boot API: `http://localhost:8080`
- 데이터베이스: `spovisor`
- 사용자/비밀번호: `spovisor` / `spovisor`

PostgreSQL 볼륨은 `spovisor-postgres-data`에 저장되므로 컨테이너를 다시 시작해도 데이터가 유지됩니다.

## API

### 회원가입

`POST /api/auth/signup`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동"
}
```

### 로그인

`POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

두 API 모두 `accessToken`, `userId`, `email`, `nickname`을 반환합니다.

## 네이버 검색 API 설정

장소·출발지 검색은 네이버 지역 검색 API를 백엔드에서 호출합니다. 네이버 개발자 센터에서 검색 API 사용 권한을 활성화한 뒤 다음 환경변수를 설정하세요.

```powershell
$env:NAVER_CLIENT_ID = "발급받은 Client ID"
$env:NAVER_CLIENT_SECRET = "발급받은 Client Secret"
```

클라이언트 시크릿은 앱(Expo)에 넣지 않고 백엔드에만 둡니다.

## 앱 기능 API

모든 아래 API는 로그인 후 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.

- `GET/PATCH/DELETE /api/users/me`: 프로필 조회·수정·회원탈퇴
- `PATCH /api/users/me/password`: 비밀번호 변경
- `GET/POST/PUT /api/user/survey`: 마지막 설문 조회·저장
- `GET/POST/DELETE /api/courses/saved`: 저장 코스 조회·저장·삭제
- `GET/POST /api/trips`: 여행 기록 조회·생성
- `PATCH /api/trips/{tripId}/feedback`: 여행 평점·방문 장소 저장
- `POST/GET /api/recommendations/requests`: AI 연동 전 추천 요청 원본 저장·조회

AI 서버가 완성되면 추천 요청 API의 `PENDING` 요청을 기준으로 AI 결과를 연결하면 됩니다. 현재 백엔드는 AI 추천 계산이나 관광 API 호출을 수행하지 않습니다.

## Flyway

- `V1__create_ai_tables.sql`: 캡처 기준 4개 테이블 생성
- `V2__seed_ai_tables.sql`: `spots.json` 3,255건과 `relations.json` 3,254건 입력
- `V3__create_app_user_table.sql`: 회원가입/로그인용 `app_user` 테이블 생성

Flyway는 Spring Boot 시작 시 버전 순서대로 실행합니다. 이미 실행된 마이그레이션 파일을 수정하지 말고, 데이터 변경은 `V4__...sql` 같은 새 파일로 추가하세요.

## 기존 로컬 PostgreSQL을 직접 사용할 때

Docker Compose를 사용하지 않고 기존 PostgreSQL을 사용할 경우 `backend/src/main/resources/application.yml`의 환경변수를 설정합니다.

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/spovisor"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "실제 PostgreSQL 비밀번호"
```
