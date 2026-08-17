# 🏆 Spovisor 관광 코스 추천 모델

프로스포츠 연고지 기반 여행 코스 추천 시스템

---

## 파일 구조

```
📁 spovisor-model
├── 📄 constants.py       벡터 상수 및 설정값 정의
├── 📄 model.py           추천 로직 핵심 함수
├── 📄 batch.py           배치 스크립트 (장소 데이터 수집)
├── 📄 recommend.py       Flask API 서버
├── 📄 requirements.txt   필요 라이브러리
└── 📄 .gitignore
```

---

## 설치 및 실행

### 1. 환경변수 설정
```bash
cp .env.example .env
# .env 파일 열어서 API_KEY, DB 정보 입력
```

### 2. 라이브러리 설치
```bash
pip install -r requirements.txt
```

### 3. 배치 실행 (장소 데이터 수집)
```bash
python batch.py
# → spots.json, relations.json 생성
# → 백엔드 연동 후: save_to_db=True 로 변경
```

### 4. 추천 서버 실행
```bash
python recommend.py
# → http://localhost:5000 에서 실행
```

---

## API 명세

### POST /recommend
추천 코스 생성

**Request**
```json
{
  "survey": {
    "경기장":       "수원 KT위즈파크",
    "여행_방식":    "경기 전",
    "이동수단":     "대중교통",
    "최대이동시간": "1시간",
    "동행":         "친구와 여행",
    "추가동행":     [],
    "컨셉":         "미식 탐방형",
    "추가조건":     ["혼잡 피하기"],
    "고정핀":       [],
    "제외조건":     []
  }
}
```

**Response**
```json
{
  "courses": [
    {
      "course_id": 1,
      "spots": [
        {"name": "채빛퀴진", "category": "음식", "map_x": "...", "map_y": "..."}
      ],
      "summary": "서울 송파 미식 코스예요...",
      "tags": ["맛집", "자연", "쇼핑"],
      "stats": {"총 장소": 5, "음식": 3, "관광": 1, "거리(km)": 6.0}
    }
  ],
  "user_result": {"vector": [...], "meta": {...}},
  "signgu_cd": "11710"
}
```

---

### POST /feedback
좋아요/싫어요 반영 후 재추천

**Request**
```json
{
  "user_result":         {"vector": [...], "meta": {...}},
  "signgu_cd":           "11710",
  "liked_spot_names":    ["채빛퀴진"],
  "disliked_spot_names": ["롯데월드몰"]
}
```

**Response**
```json
{
  "courses": [...],
  "user_result": {"vector": [...], "meta": {...}}
}
```

---

### GET /survey?user_id=xxx
마지막 설문 불러오기 (백엔드 연동 후)

### POST /survey
설문 저장 (백엔드 연동 후)

---

## 백엔드 연동 체크리스트

- [ ] `spots.json` → `spot_cache` 테이블 적재
- [ ] `relations.json` → `spot_relation` 테이블 적재
- [ ] `GET /spots/cache` API 오픈
- [ ] `GET /spots/relations` API 오픈
- [ ] `GET·POST /user/survey` API 오픈
- [ ] `batch.py` → `save_to_db=True` 로 변경
- [ ] `recommend.py` → DB 조회 함수로 교체

---

## 배치 실행 주기

| 주기 | 스크립트 | 내용 |
|---|---|---|
| 월 1회 | `python batch.py` | 전체 장소 데이터 갱신 |
| 매일 | 혼잡도 별도 배치 | 향후 30일 혼잡도 갱신 |
