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
