# 🏟️ Spovisor (스포바이저)

> **개인 맞춤형 스포츠 여행 추천 서비스**
> 경기 일정과 여행 취향을 입력하면, 원정 응원을 여행으로 이어주는 맞춤 코스를 추천합니다.

🏆 **2026 관광데이터 활용 공모전 (웹·앱 개발 부문)** 출품작 · 한국관광공사 주최

---

## 📌 프로젝트 소개

프로스포츠 관람과 원정 응원 수요가 늘어나면서, 경기 관람을 관광으로 연결할 수 있지 않을까 하는 아이디어에서 시작했습니다.
사용자가 **경기 일정**과 **여행 취향 설문**을 입력하면, 이를 반영해 **개인형 맞춤 여행 코스**를 제공합니다.

## ✨ 주요 기능

- 경기 일정 및 여행 취향 설문 입력
- AI 기반 맞춤 여행 코스 추천
- 추천 코스 저장 및 조회
- 네이버 지도 기반 코스 시각화
- 로그인 기능

## 🛠️ 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Spring Boot, Spring Data JPA |
| Frontend | React Native, Expo |
| Database | PostgreSQL |
| AI Server | Python, Flask, NumPy |
| DevOps | Docker, Docker Compose, AWS, Git |
| External API | Naver Maps API, Naver Search API, 한국관광공사 TourAPI |
| Design | Figma |

### 🤖 AI 서버 스택

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
[Spring Boot 서버] ──── [PostgreSQL]
        │  (이벤트 기반 비동기 요청 / RestTemplate)
        ▼
[Flask AI 추천 서버] ──── [한국관광공사 TourAPI 등]
```

## 🌿 브랜치 구성

| 브랜치 | 설명 |
|---|---|
| `main` | 프로젝트 소개 및 문서 |
| `feature/front-end` | 프론트엔드 초안 모델 |
| `feature/front-end_login` | 프론트엔드 로그인 기능 추가 |
| `feature/front-end_v2` | 프론트엔드 연동 최종 버전 |
| `feature/back-end` | 백엔드 전체 |
| `feature/ai-model` | AI 모델 및 추천 서버 |

## 📁 AI 서버 구조 (`feature/ai-model`)

```
spovisor-model
├── constants.py       # 벡터 상수 및 설정값 정의
├── model.py           # 추천 로직 핵심 함수
├── recommend.py       # Flask API 서버
├── requirements.txt   # 필요 라이브러리
└── .gitignore
```

## 🧩 프로젝트 구성

Spovisor는 모바일 앱, 백엔드 서버, AI 추천 서버 세 계층으로 구성되며, Docker 기반으로 AWS에 배포했습니다.

### 📱 Frontend (React Native · Expo)
- Expo 기반 모바일 앱 UI 및 화면 흐름 구현
- 경기 일정 및 여행 취향 설문 입력 화면
- 로그인 기능
- 추천 코스 조회 및 저장한 코스 확인
- 네이버 지도 API를 활용한 코스 및 장소 시각화
- Figma를 활용한 UI/UX 설계

### ⚙️ Backend (Spring Boot · PostgreSQL)
- 계층형 구조(Controller / Service / Repository) 및 JPA 기반 데이터 관리
- 여행 코스 저장·조회 API
- 설문 데이터 정규화 및 유효성 검증
- Spring 이벤트 기반 비동기 AI 추천 요청 처리
- RestTemplate을 이용한 AI 서버 연동 및 JSON 데이터 송수신
- AI 서버 응답에 따른 추천 요청 상태 관리 및 예외 처리

### 🤖 AI 추천 서버 (Python · Flask)
- 설문 결과를 벡터로 변환해 사용자 취향 표현 (`constants.py`)
- 취향 벡터와 관광지 데이터를 비교하는 추천 로직 (`model.py`)
- Flask 기반 추천 API로 백엔드에 코스 결과 제공 (`recommend.py`)
- TODO: 추천 방식(유사도 계산 방식, 코스 구성 기준 등)을 확인해 구체적으로 작성

### 🔌 외부 API 연동
- **한국관광공사 TourAPI**: 관광지 및 여행 정보 데이터
- **Naver Maps API**: 지도 표시
- **Naver Search API**: 장소 관련 검색 정보

### 🚀 Deployment (Docker · AWS)
- Dockerfile 및 Docker Compose로 컨테이너 실행 환경 구성
- AWS Linux 환경에서 Docker 기반 서비스 배포
- 원스토어 앱 등록

### 🔄 추천 요청 흐름

```
1. 사용자가 앱에서 경기 일정과 여행 취향 설문을 입력
2. Spring Boot 서버가 설문 데이터를 정규화하고 유효성을 검증
3. 추천 요청을 저장하고, 이벤트 기반으로 비동기 처리
4. Flask AI 서버에 RestTemplate으로 추천 요청 (JSON)
5. AI 서버가 맞춤 여행 코스를 생성해 응답
6. 서버가 응답 결과와 요청 상태를 저장 (실패 시 예외 처리)
7. 앱에서 추천 코스를 지도와 함께 확인
```

## 🚩 결과

- 원스토어 앱 등록
