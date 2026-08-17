# recommend.py
# Flask API 서버 - 추천 모델을 API 엔드포인트로 제공
# 실행: python recommend.py

import os
import json
import requests as req
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from model import (
    build_user_vec, build_spot_vec,
    filter_candidates, build_course,
    mmr_courses, generate_summary, apply_feedback,
)

load_dotenv()

app         = Flask(__name__)
CORS(app)   # 프론트엔드 CORS 허용

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

# ── 데이터 로드 ────────────────────────────────
# 백엔드 연동 전: JSON 파일에서 로드
# 백엔드 연동 후: get_spots_from_db() 함수 사용

def load_data_from_json():
    """백엔드 연동 전 임시 방법 - JSON 파일에서 로드"""
    with open("spots.json", "r", encoding="utf-8") as f:
        spots = json.load(f)
    with open("relations.json", "r", encoding="utf-8") as f:
        relations = json.load(f)
    return spots, relations


def get_spots_from_db(signgu_cd):
    """백엔드 연동 후 - DB에서 지역별 장소 조회"""
    res = req.get(f"{BACKEND_URL}/spots/cache", params={"signgu_cd": signgu_cd})
    return res.json().get("spots", [])


def get_relations_from_db(signgu_cd):
    """백엔드 연동 후 - DB에서 연관 관광지 조회"""
    res = req.get(f"{BACKEND_URL}/spots/relations", params={"signgu_cd": signgu_cd})
    return res.json().get("relations", [])


# ── 경기장 → 지역 코드 매핑 ───────────────────
STADIUM_TO_SIGNGU = {
    "잠실야구장":          "11710",
    "고척스카이돔":        "11530",
    "수원 KT위즈파크":    "41111",
    "인천SSG랜더스필드":  "28177",
    "한화생명이글스파크": "30140",
    "광주-기아챔피언스필드": "29170",
    "사직야구장":         "26260",
    "대구삼성라이온즈파크": "27260",
    "창원NC파크":         "48127",
    "서울월드컵경기장":   "11440",
    "수원월드컵경기장":   "41111",
    "전주월드컵경기장":   "52113",
    "포항스틸야드":       "47111",
    "울산문수경기장":     "31140",
    "대구DGB대구은행파크": "27260",
}


# ── API 엔드포인트 ─────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """서버 상태 확인"""
    return jsonify({"status": "ok"})


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    추천 코스 생성 API

    Request Body:
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

    Response:
    {
        "courses": [
            {
                "course_id": 1,
                "spots": [
                    {"name": "채빛퀴진", "category": "음식", "map_x": "...", "map_y": "..."},
                    ...
                ],
                "summary": "서울 송파 미식 코스예요...",
                "tags": ["맛집", "자연", "쇼핑"],
                "stats": {"총 장소": 5, "음식": 3, "관광": 1, "거리(km)": 6.0}
            },
            ...
        ],
        "user_result": {...}  # 피드백 API에서 재사용
    }
    """
    try:
        data   = request.json
        survey = data.get("survey", {})

        if not survey:
            return jsonify({"error": "survey 데이터가 없어요"}), 400

        # 사용자 벡터 생성
        user_result = build_user_vec(survey)

        # 지역 코드 확인
        stadium   = survey.get("경기장", "")
        signgu_cd = STADIUM_TO_SIGNGU.get(stadium)

        if not signgu_cd:
            return jsonify({"error": f"'{stadium}'에 해당하는 지역 코드가 없어요"}), 400

        # 장소 데이터 로드
        # TODO: 백엔드 연동 후 아래 두 줄로 교체
        # spots     = get_spots_from_db(signgu_cd)
        # relations = get_relations_from_db(signgu_cd)
        all_spots, all_relations = load_data_from_json()
        spots     = [s for s in all_spots     if s["signgu_cd"] == signgu_cd]
        relations = [r for r in all_relations if any(s["spot_name"] == r["spot_nm"] for s in spots)]

        if not spots:
            return jsonify({"error": "해당 지역 장소 데이터가 없어요"}), 404

        # 필터링 → 대안 코스 생성
        candidates  = filter_candidates(user_result, spots, relations)
        alt_courses = mmr_courses(user_result, candidates, k=3, n=5)

        # 응답 구성
        city   = next((name for ac, sc, name in [
            ("11","11710","서울 송파"), ("11","11530","서울 강서"),
            ("41","41111","수원"), ("28","28177","인천"),
        ] if sc == signgu_cd), stadium)

        concept = user_result["meta"]["concept"]
        output  = []

        for i, course in enumerate(alt_courses, 1):
            summary = generate_summary(course, city, concept)
            output.append({
                "course_id": i,
                "spots": [
                    {
                        "name":     s["spot_name"],
                        "category": s["mcls_nm"],
                        "map_x":    s.get("map_x"),
                        "map_y":    s.get("map_y"),
                    }
                    for s in course
                ],
                "summary": summary["summary"],
                "tags":    summary["tags"],
                "stats":   summary["stats"],
            })

        return jsonify({
            "courses":     output,
            "user_result": {
                "vector": user_result["vector"],
                "meta":   user_result["meta"],
            },
            "signgu_cd": signgu_cd,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/feedback", methods=["POST"])
def feedback():
    """
    피드백 반영 후 재추천 API

    Request Body:
    {
        "user_result":      {...},           # /recommend 응답의 user_result
        "signgu_cd":        "11710",         # /recommend 응답의 signgu_cd
        "liked_spot_names":    ["채빛퀴진"],
        "disliked_spot_names": ["롯데월드몰"]
    }

    Response:
    {
        "courses":     [...],   # 재추천 결과
        "user_result": {...}    # 업데이트된 벡터
    }
    """
    try:
        data        = request.json
        user_result = data.get("user_result")
        signgu_cd   = data.get("signgu_cd")

        if not user_result or not signgu_cd:
            return jsonify({"error": "user_result 또는 signgu_cd가 없어요"}), 400

        # 장소 데이터 로드
        all_spots, all_relations = load_data_from_json()
        spots     = [s for s in all_spots     if s["signgu_cd"] == signgu_cd]
        relations = [r for r in all_relations if any(s["spot_name"] == r["spot_nm"] for s in spots)]

        # 좋아요/싫어요 장소 찾기
        liked_names    = data.get("liked_spot_names", [])
        disliked_names = data.get("disliked_spot_names", [])

        liked    = [s for s in spots if s["spot_name"] in liked_names]
        disliked = [s for s in spots if s["spot_name"] in disliked_names]

        # 피드백 반영
        updated = apply_feedback(user_result, liked_spots=liked, disliked_spots=disliked)

        # 재추천
        candidates  = filter_candidates(updated, spots, relations)
        alt_courses = mmr_courses(updated, candidates, k=3, n=5)

        concept = updated["meta"]["concept"]
        output  = []

        for i, course in enumerate(alt_courses, 1):
            summary = generate_summary(course, "", concept)
            output.append({
                "course_id": i,
                "spots": [
                    {
                        "name":     s["spot_name"],
                        "category": s["mcls_nm"],
                        "map_x":    s.get("map_x"),
                        "map_y":    s.get("map_y"),
                    }
                    for s in course
                ],
                "summary": summary["summary"],
                "tags":    summary["tags"],
                "stats":   summary["stats"],
            })

        return jsonify({
            "courses":     output,
            "user_result": {
                "vector": updated["vector"],
                "meta":   updated["meta"],
            },
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/survey", methods=["GET"])
def get_survey():
    """
    마지막 설문 불러오기 API
    백엔드 DB 연동 후 활성화

    Query Params: user_id
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id가 없어요"}), 400

    try:
        # 백엔드에서 설문 조회
        res = req.get(f"{BACKEND_URL}/user/survey", params={"user_id": user_id})
        return jsonify(res.json())
    except Exception:
        return jsonify({"survey": None})


@app.route("/survey", methods=["POST"])
def save_survey():
    """
    설문 저장 API
    백엔드 DB 연동 후 활성화

    Request Body: { "user_id": "...", "survey": {...} }
    """
    data = request.json
    try:
        res = req.post(f"{BACKEND_URL}/user/survey", json=data)
        return jsonify(res.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 서버 실행 ──────────────────────────────────

if __name__ == "__main__":
    host  = os.getenv("FLASK_HOST",  "0.0.0.0")
    port  = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False") == "True"

    print(f"🚀 추천 서버 시작: http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
