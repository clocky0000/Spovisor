# Spovisor 운영 배포 준비

## 안전장치

- 운영 Compose는 PostgreSQL과 AI 서비스를 외부 포트에 노출하지 않습니다.
- 백엔드는 컨테이너의 비루트 `spovisor` 사용자로 실행됩니다.
- `prod` profile은 DB/JWT/외부 API/AI/CORS 환경변수가 없으면 시작되지 않습니다.
- 백엔드는 `127.0.0.1`에만 바인딩됩니다. 인터넷 공개는 HTTPS 리버스 프록시 또는 클라우드 로드밸런서를 통해서만 수행합니다.
- `/actuator/health`만 공개하고 상세 상태는 노출하지 않습니다.
- 출처 권리가 불명확한 네이버 이미지 검색 fallback은 운영에서 강제로 비활성화됩니다.

## 실행 전

1. `.env.production.example`을 `.env.production`으로 복사하고 모든 값을 실제 비밀값으로 교체합니다. 실제 파일은 Git에 커밋하지 않습니다.
2. `JWT_SECRET`은 비밀번호 생성기로 만든 64자 이상의 무작위 값으로 설정합니다.
3. `CORS_ALLOWED_ORIGIN_PATTERNS`에는 공개할 웹 프론트 주소만 쉼표로 구분해 입력합니다. Android 네이티브 요청은 CORS 대상이 아닙니다.
4. 백업 암호화, PostgreSQL 정기 백업, 로그 90일 자동 삭제, 장애 알림을 배포 플랫폼에서 설정합니다.
5. `privacy.html`의 운영자 정보 및 실제 클라우드·AI 처리업체와 국외 이전 정보를 확정합니다.

## 원스토어 심사용 계정

심사용 계정 비밀번호를 소스나 SQL에 넣지 않습니다. `.env.production`에 다음 값을 실제 전용 계정으로 설정하면 백엔드 시작 시 계정이 생성됩니다.

```dotenv
REVIEWER_ACCOUNT_ENABLED=true
REVIEWER_ACCOUNT_EMAIL=<원스토어에 제출할 이메일>
REVIEWER_ACCOUNT_PASSWORD=<8~100자의 전용 비밀번호>
REVIEWER_ACCOUNT_NICKNAME=민서
```

- 계정이 처음 생성될 때만 관심 구단 `LG`, 저장된 `잠실 야구 나들이` 코스 1개, 별점 5점의 완료 여행 1개를 함께 생성합니다.
- 같은 이메일의 계정이 이미 있으면 비밀번호와 사용자 데이터를 전혀 수정하지 않고 초기화를 건너뜁니다. 이후 삭제·추가·변경한 내용은 일반 사용자 계정처럼 그대로 유지됩니다.
- 최초 초기화 완료 여부는 사용자와 독립된 `app_seed_history`에 기록됩니다. 따라서 계정 탈퇴 후 서버가 재시작되어도 계정이나 샘플 데이터가 다시 생성되지 않습니다.
- PostgreSQL 볼륨을 삭제하여 완전히 새로운 DB를 만들었을 때만 최초 seed가 다시 실행됩니다.
- 계정 생성을 확인한 뒤 `REVIEWER_ACCOUNT_ENABLED=false`로 바꿔도 DB의 계정은 유지됩니다.
- 심사가 끝날 때까지 계정을 삭제하거나 비밀번호를 바꾸지 않습니다.
- 운영 로그에는 이메일과 비밀번호를 출력하지 않습니다.
- `.env.onestore-review`는 Git에서 제외된 실제 심사 계정 설정 파일입니다. 배포 담당자에게 별도 보안 채널로 전달합니다.
- 로컬·운영 Compose 모두 `.env.onestore-review`를 백엔드에 자동으로 주입합니다. 별도의 심사 계정 옵션을 명령에 추가할 필요가 없습니다.

## 검증 및 시작

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

리버스 프록시 설정 후 다음을 외부 네트워크에서 확인합니다.

- `https://<API 도메인>/actuator/health`
- `https://<API 도메인>/privacy.html`
- `https://<API 도메인>/terms.html`
- 회원가입 → 로그인 → 추천 → 저장 → 탈퇴 전체 흐름

## 롤백

새 이미지는 버전 태그로 보관하고 이전 이미지 태그를 즉시 재배포할 수 있게 합니다. Flyway 마이그레이션은 기존 컬럼을 삭제하지 않는 전진 호환 방식으로만 추가합니다. 배포 직전 DB 스냅샷을 생성하고 복구 절차를 한 번 검증합니다.
