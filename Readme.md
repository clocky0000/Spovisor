# 🏟️ 스포바이저 (Spovisor)

> 경기 일정과 여행 취향을 입력하면, 원정 응원을 여행으로 이어주는 **개인 맞춤형 스포츠 여행 추천 서비스**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat&logo=springboot&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)

## 🏆 수상 / 출품

- **2026 관광데이터 활용 공모전 (웹·앱 개발 부문)** 출품 · 한국관광공사 주최
- 원스토어 앱 등록

## 📖 프로젝트 소개

스포바이저는 사용자의 **경기 일정**과 **여행 취향**을 바탕으로 개인형 맞춤 여행 코스를 제공하는 모바일 서비스입니다.
경기 관람에서 끝나지 않고, 경기장이 있는 도시의 관광까지 하나의 여행으로 이어주는 것을 목표로 합니다.

### 기획 배경

- **프로스포츠 관람 수요의 증가**: 프로스포츠 관람객이 늘면서 팬 문화가 하나의 여가 활동으로 자리 잡고 있습니다.
- **원정 응원 수요의 증가**: 다른 지역 경기장을 찾는 원정 응원이 늘고 있지만, 경기 관람 외 여행 일정은 직접 찾아 짜야 합니다.
- **관광으로의 연결 필요**: 경기 일정이라는 명확한 방문 목적을 관광 소비로 연결할 수 있는 개인화 서비스가 부족합니다.

### 타깃 유저

| 구분 | 대상 |
|---|---|
| 주 타깃 | 프로스포츠를 관람하고 원정 응원을 가는 팬 |
| 부 타깃 | 경기 일정에 맞춰 짧은 여행을 계획하는 여행객 |

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| 회원가입 / 로그인 | 이메일 기반 자체 가입, JWT 인증. 가입 시 이용약관·개인정보 처리방침 동의 버전을 기록합니다. |
| 프로필 설정 | 닉네임, 마스코트, 테마 컬러를 설정해 앱을 개인화합니다. |
| 경기 일정 입력 | 관람할 경기 일정을 입력해 여행의 기준으로 삼습니다. |
| 여행 취향 설문 | 설문으로 사용자의 여행 취향을 수집하고 정규화·검증합니다. |
| 맞춤 코스 추천 | AI 추천 서버가 취향과 경기 일정을 반영한 여행 코스를 생성합니다. |
| 코스 저장·조회 | 추천받은 코스를 저장하고 다시 확인할 수 있습니다. |
| 지도 시각화 | 네이버 지도 위에서 코스와 장소를 확인합니다. |

## 🛠️ 기술 스택

| 분류 | 기술 |
|---|---|
| Client | React Native, Expo |
| Core Service | Spring Boot, Spring Data JPA, Spring Security, JWT |
| AI Sub-Backend | Python, Flask, NumPy |
| Database | PostgreSQL |
| External API | Naver Maps API, Naver Search API, 한국관광공사 TourAPI |
| Design | Figma |
| CI/CD & Infra | Git, Docker, Docker Compose, AWS (Linux) |

### AI 서버 라이브러리

| 라이브러리 | 버전 |
|---|---|
| Flask | 3.0.0 |
| flask-cors | 4.0.0 |
| NumPy | 1.26.0 |
| PyMySQL | 1.1.0 |
| requests | 2.31.0 |
| python-dotenv | 1.0.0 |

## 🏗️ 시스템 구조

```
[React Native 앱]
      │  REST API
      ▼
[Spring Boot (Core Service)] ───► [PostgreSQL]
      │  Spring Event 기반 비동기 요청 (RestTemplate, JSON)
      ▼
[Flask (AI 추천 서버)]
      └─ 설문 벡터화 및 추천 로직
      └─ TourAPI 등 관광 데이터 조회 방식
```

### 유저 플로우

```
로그인 → 메인
  └─ 여행 코스 만들기
       → 경기 일정 입력
       → 여행 취향 설문
       → 설문 정규화 및 유효성 검증 (Spring Boot)
       → 추천 요청 생성 (상태: 대기)
       → 이벤트 기반 비동기 처리 → AI 서버에 추천 요청
       → AI 서버가 코스 생성 후 응답
       → 추천 결과 및 요청 상태 저장 (실패 시 예외 처리)
       → 추천 코스를 지도와 함께 확인
       → 코스 저장 / 조회
```

## 🗄️ 데이터베이스 설계

PostgreSQL을 사용하며, 스키마 변경은 Flyway로 버전 관리합니다.

| 테이블 | 설명 |
|---|---|
| app_user | 사용자 계정 정보 |
| app_user_survey | 사용자별 여행 취향 설문 응답 |
| user_survey | 설문 리스트 관리 |
| user_favorite_team | 사용자가 응원하는 팀 |
| user_favorite_place | 사용자가 즐겨찾기한 장소 |
| recommendation_request | AI 추천 요청 |
| saved_course | 사용자가 저장한 추천 여행 코스 |
| trip_history | 사용자의 여행 이력 |
| spot_cache | 외부 API(TourAPI 등)로 조회한 관광지 정보 캐시 |
| spot_congestion | 관광지 혼잡도 정보 |
| spot_relation | 관광지 간 연관 관계 |
| flyway_schema_history | Flyway 마이그레이션 이력 |

## 🧠 AI 추천 서버

설문으로 수집한 사용자 취향을 벡터로 표현하고, 이를 기반으로 여행 코스를 추천합니다.

### 서버 구조 (`feature/ai-model`)

```
spovisor-model
├── constants.py       # 벡터 상수 및 설정값 정의
├── model.py           # 추천 로직 핵심 함수
├── recommend.py       # Flask API 서버
├── requirements.txt   # 필요 라이브러리
└── .gitignore
```

## 🌿 브랜치 구조

| 브랜치 | 설명 |
|---|---|
| `main` | 프로젝트 개요 (README) |
| `feature/front-end` | 프론트엔드 초안 모델 |
| `feature/front-end_login` | 프론트엔드 로그인 기능 추가 |
| `feature/front-end_v2` | 프론트엔드 연동 최종 버전 |
| `feature/back-end` | 백엔드(Spring Boot) 전체 |
| `feature/ai-model` | AI 추천 모델 및 Flask 서버 |

소스코드는 위 feature 브랜치에서 확인할 수 있습니다.

## 👥 팀원

| 이름 | 담당 | 한 줄 요약 |
|---|---|---|
| 이여진 | Backend / Frontend / 배포 | 인증·사용자 도메인과 설문 처리, 로그인·마이페이지 UI, 원스토어 배포 |
| 한윤슬 | Backend / Frontend / 배포 | 코스 저장·조회와 AI 서버 연동, 앱 초안 및 지도 UI, Docker·AWS 배포 |
| 이윤지 | AI | 추천 코스 모델 설계 및 Flask 서버 구현 |

### 이여진

**Backend**
- 회원가입·로그인 구현: 이메일 정규화 및 중복 검사, 비밀번호 해시 저장, JWT 발급
- 이용약관·개인정보 처리방침 동의 버전 기록
- 프로필 설정(닉네임, 마스코트, 테마 컬러) API
- 여행 취향 설문 데이터 정규화 및 유효성 검증
- 응원 팀·즐겨찾기 장소 등 사용자 데이터 API

**Frontend**
- 로그인·회원가입 화면 (`feature/front-end_login`)
- 마이페이지 화면

**Deployment**
- 원스토어 앱 등록 및 심사 대응

### 한윤슬

**Backend**
- JPA 기반 여행 코스 저장·조회 API 구현
- AI 추천 서버 연동: Spring 이벤트 기반 비동기 요청, RestTemplate으로 JSON 송수신
- 추천 요청 상태 관리 및 AI 서버 응답에 따른 예외 처리

**Frontend**
- 앱 초안 UI 구현 (`feature/front-end`)
- 네이버 지도 API 기반 지도 기능 (코스·장소 시각화)

**Deployment**
- Dockerfile·Docker Compose 기반 컨테이너 환경 구성
- AWS Linux 환경에 Docker 기반 서비스 배포

### 이윤지

**AI**
- 설문 결과를 벡터로 변환하는 방식 설계 (`constants.py`)
- 취향 벡터 기반 추천 로직 구현 (`model.py`)
- Flask 추천 API 서버 구현 (`recommend.py`)
