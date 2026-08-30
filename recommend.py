# recommend.py
# Flask API 서버 - 실시간 TourAPI 호출 방식
# 실행: python recommend.py

import os
import time
import requests as req
import xml.etree.ElementTree as ET
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from model import (
    build_user_vec, build_spot_vec, build_region_vec,
    filter_candidates, build_course,
    mmr_courses, generate_summary, apply_feedback,
)
from constants import TAR_SVC_CODES, CUL_RES_CODES

load_dotenv()

app         = Flask(__name__)
CORS(app)

API_KEY     = os.getenv("API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

# ── 경기장 → 지역코드 매핑 ───────────────────
# regions 리스트 기준으로 구단/경기장명과 지역코드 매핑
STADIUM_TO_REGION = {

    # ── 서울 ──────────────────────────────────
    "서울종합운동장야구장":         {"areaCd": "11", "signguCd": "11710", "city": "서울 송파",   "lat": 37.5121513808403,  "lng": 127.071909507224},
    "서울특별시교육청학생체육관":   {"areaCd": "11", "signguCd": "11710", "city": "서울 송파",   "lat": 37.51219787219792, "lng": 127.07537857414752},
    "잠실학생체육관":               {"areaCd": "11", "signguCd": "11710", "city": "서울 송파",   "lat": 37.51219787219792, "lng": 127.07537857414752},
    "고척스카이돔":                 {"areaCd": "11", "signguCd": "11530", "city": "서울 구로",   "lat": 37.49821220764421, "lng": 126.8670889679075},
    "장충체육관":                   {"areaCd": "11", "signguCd": "11140", "city": "서울 중구",   "lat": 37.558178171371,   "lng": 127.006808757736},
    "서울월드컵경기장":             {"areaCd": "11", "signguCd": "11440", "city": "서울 마포",   "lat": 37.56825003712418, "lng": 126.89724365713197},

    # ── 인천 ──────────────────────────────────
    "인천SSG랜더스필드":            {"areaCd": "28", "signguCd": "28177", "city": "인천 미추홀", "lat": 37.436998685442084,"lng": 126.69327612453377},
    "인천삼산월드체육관":           {"areaCd": "28", "signguCd": "28237", "city": "인천 부평",   "lat": 37.50800280504626, "lng": 126.73832589829678},
    "계양체육관":                   {"areaCd": "28", "signguCd": "28245", "city": "인천 계양",   "lat": 37.5339610690414,  "lng": 126.748058093851},
    "인천축구전용경기장":           {"areaCd": "28", "signguCd": "28110", "city": "인천 중구",   "lat": 37.466162868183204,"lng": 126.64300764788254},
    "인천도원체육관":               {"areaCd": "28", "signguCd": "28110", "city": "인천 중구",   "lat": 37.4662778536466,  "lng": 126.640813029151},

    # ── 경기도 ────────────────────────────────
    "수원KT위즈파크":               {"areaCd": "41", "signguCd": "41111", "city": "수원 장안",   "lat": 37.2997302532973,  "lng": 127.009772045935},
    "수원 KT위즈파크":              {"areaCd": "41", "signguCd": "41111", "city": "수원 장안",   "lat": 37.2997302532973,  "lng": 127.009772045935},
    "수원체육관":                   {"areaCd": "41", "signguCd": "41111", "city": "수원 장안",   "lat": 37.2983643371609,  "lng": 127.009072589574},
    "수원실내체육관":               {"areaCd": "41", "signguCd": "41111", "city": "수원 장안",   "lat": 37.2983643371609,  "lng": 127.009072589574},
    "화성실내체육관":               {"areaCd": "41", "signguCd": "41590", "city": "화성 만세",   "lat": 37.13830760228957, "lng": 126.92247625610617},
    "이충문화체육센터":             {"areaCd": "41", "signguCd": "41150", "city": "평택",         "lat": 37.06601927536289, "lng": 127.07072607979842},
    "부천종합운동장":               {"areaCd": "41", "signguCd": "41192", "city": "부천 원미",   "lat": 37.50254894022013, "lng": 126.79901040032861},
    "부천체육관":                   {"areaCd": "41", "signguCd": "41192", "city": "부천 원미",   "lat": 37.513420835860586,"lng": 126.7632385988074},
    "부천실내체육관":               {"areaCd": "41", "signguCd": "41192", "city": "부천 원미",   "lat": 37.513420835860586,"lng": 126.7632385988074},
    "안양종합운동장":               {"areaCd": "41", "signguCd": "41173", "city": "안양 동안",   "lat": 37.405329029129256,"lng": 126.94651386558405},
    "안양정관장아레나":             {"areaCd": "41", "signguCd": "41173", "city": "안양 동안",   "lat": 37.4050523816749,  "lng": 126.948465782089},
    "고양소노아레나":               {"areaCd": "41", "signguCd": "41287", "city": "고양 일산서", "lat": 37.6745773792369,  "lng": 126.741820500325},
    "수원KT소닉붐아레나":           {"areaCd": "41", "signguCd": "41113", "city": "수원 권선",   "lat": 37.276272539357,   "lng": 126.948290984046},
    "용인실내체육관":               {"areaCd": "41", "signguCd": "41461", "city": "용인 처인",   "lat": 37.23740975113005, "lng": 127.21341259333057},

    # ── 대전 ──────────────────────────────────
    "대전한화생명볼파크":           {"areaCd": "30", "signguCd": "30140", "city": "대전 중구",   "lat": 36.3161617310226,  "lng": 127.431535001435},
    "한화생명이글스파크":           {"areaCd": "30", "signguCd": "30140", "city": "대전 중구",   "lat": 36.3161617310226,  "lng": 127.431535001435},
    "충무체육관":                   {"areaCd": "30", "signguCd": "30140", "city": "대전 중구",   "lat": 36.3180130202897,  "lng": 127.430460586297},
    "대전충무체육관":               {"areaCd": "30", "signguCd": "30140", "city": "대전 중구",   "lat": 36.3180130202897,  "lng": 127.430460586297},
    "대전월드컵경기장":             {"areaCd": "30", "signguCd": "30200", "city": "대전 유성",   "lat": 36.365171091983576,"lng": 127.32513866896132},

    # ── 광주 ──────────────────────────────────
    "광주기아챔피언스필드":         {"areaCd": "29", "signguCd": "29170", "city": "광주 북구",   "lat": 35.16820922209541, "lng": 126.88911206152956},
    "광주-기아챔피언스필드":        {"areaCd": "29", "signguCd": "29170", "city": "광주 북구",   "lat": 35.16820922209541, "lng": 126.88911206152956},
    "SOOP스타디움":                 {"areaCd": "29", "signguCd": "29140", "city": "광주 서구",   "lat": 35.13539260200561, "lng": 126.8788644463333},
    "광주염주체육관":               {"areaCd": "29", "signguCd": "29140", "city": "광주 서구",   "lat": 35.13539260200561, "lng": 126.8788644463333},
    "광주월드컵경기장":             {"areaCd": "29", "signguCd": "29140", "city": "광주 서구",   "lat": 35.13368228982632, "lng": 126.87489504742325},

    # ── 부산 ──────────────────────────────────
    "사직야구장":                   {"areaCd": "26", "signguCd": "26260", "city": "부산 동래",   "lat": 35.194017568250274,"lng": 129.06154402103502},
    "사직실내체육관":               {"areaCd": "26", "signguCd": "26260", "city": "부산 동래",   "lat": 35.1924185304639,  "lng": 129.0607198031},
    "부산사직체육관":               {"areaCd": "26", "signguCd": "26260", "city": "부산 동래",   "lat": 35.1924185304639,  "lng": 129.0607198031},
    "강서실내체육관":               {"areaCd": "26", "signguCd": "26440", "city": "부산 강서",   "lat": 35.2101315792417,  "lng": 128.97223684359},
    "부산강서체육관":               {"areaCd": "26", "signguCd": "26440", "city": "부산 강서",   "lat": 35.2101315792417,  "lng": 128.97223684359},

    # ── 대구 ──────────────────────────────────
    "대구삼성라이온즈파크":         {"areaCd": "27", "signguCd": "27260", "city": "대구 수성",   "lat": 35.8410595632468,  "lng": 128.681659448344},
    "대구체육관":                   {"areaCd": "27", "signguCd": "27230", "city": "대구 북구",   "lat": 35.8934361897145,  "lng": 128.603454695703},
    "대구실내체육관":               {"areaCd": "27", "signguCd": "27230", "city": "대구 북구",   "lat": 35.8934361897145,  "lng": 128.603454695703},
    "DGB대구은행파크":              {"areaCd": "27", "signguCd": "27230", "city": "대구 북구",   "lat": 35.881249474718,   "lng": 128.588242697948},

    # ── 창원 ──────────────────────────────────
    "창원NC파크":                   {"areaCd": "48", "signguCd": "48127", "city": "창원 마산회원","lat": 35.22280070751199, "lng": 128.5820053292696},
    "창원체육관":                   {"areaCd": "48", "signguCd": "48123", "city": "창원 성산",   "lat": 35.2327367366309,  "lng": 128.666283189427},
    "창원실내체육관":               {"areaCd": "48", "signguCd": "48123", "city": "창원 성산",   "lat": 35.2327367366309,  "lng": 128.666283189427},

    # ── 경북 ──────────────────────────────────
    "김천실내체육관":               {"areaCd": "47", "signguCd": "47150", "city": "김천",         "lat": 36.14291691823165, "lng": 128.0868523538595},
    "김천종합스포츠타운":           {"areaCd": "47", "signguCd": "47150", "city": "김천",         "lat": 36.14291691823165, "lng": 128.0868523538595},
    "포항스틸야드":                 {"areaCd": "47", "signguCd": "47111", "city": "포항 남구",   "lat": 35.9977222824466,  "lng": 129.38441519469},

    # ── 충남 ──────────────────────────────────
    "유관순체육관":                 {"areaCd": "44", "signguCd": "44133", "city": "천안 서북",   "lat": 36.82087703646577, "lng": 127.11422320390537},
    "천안유관순체육관":             {"areaCd": "44", "signguCd": "44133", "city": "천안 서북",   "lat": 36.82087703646577, "lng": 127.11422320390537},
    "아산이순신체육관":             {"areaCd": "44", "signguCd": "44200", "city": "아산",         "lat": 36.76952716220382, "lng": 127.02446247383006},

    # ── 충북 ──────────────────────────────────
    "청주체육관":                   {"areaCd": "43", "signguCd": "43112", "city": "청주 서원",   "lat": 36.63657016468344, "lng": 127.47344511906337},

    # ── 강원 ──────────────────────────────────
    "강릉하이원아레나":             {"areaCd": "51", "signguCd": "51150", "city": "강릉",         "lat": 37.77365338873246, "lng": 128.8975709883576},
    "강릉아레나":                   {"areaCd": "51", "signguCd": "51150", "city": "강릉",         "lat": 37.77365338873246, "lng": 128.8975709883576},
    "원주DB프로미아레나":           {"areaCd": "51", "signguCd": "51130", "city": "원주",         "lat": 37.339049803957,   "lng": 127.94209670124236},

    # ── 울산 ──────────────────────────────────
    "울산문수축구경기장":           {"areaCd": "31", "signguCd": "31140", "city": "울산 남구",   "lat": 35.53528362130463, "lng": 129.2595358045965},
    "울산동천체육관":               {"areaCd": "31", "signguCd": "31110", "city": "울산 중구",   "lat": 35.562344053715,   "lng": 129.350433515541},

    # ── 전북 ──────────────────────────────────
    "전주월드컵경기장":             {"areaCd": "52", "signguCd": "52113", "city": "전주 덕진",   "lat": 35.86814739484495, "lng": 127.064497525143},

    # ── 제주 ──────────────────────────────────
    "제주월드컵경기장":             {"areaCd": "50", "signguCd": "50130", "city": "제주 서귀포", "lat": 33.246151627502,   "lng": 126.509381090559},
}


# ── TourAPI 실시간 호출 함수 ───────────────────

def get_region_scores(areaCd, signguCd, baseYm="202504"):
    scores = {}
    base_params = {
        "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
        "MobileOS": "AND", "MobileApp": "AppTest",
        "baseYm": baseYm, "areaCd": areaCd, "signguCd": signguCd,
    }

    for ix_cd in TAR_SVC_CODES:
        try:
            res = req.get(
                "https://apis.data.go.kr/B551011/AreaTarResDemService/areaTarSvcDemList",
                params={**base_params, "tarSvcDemIxCd": ix_cd}, timeout=10
            )
            val = ET.fromstring(res.text).findtext(".//tarSvcDemIxVal")
            if val:
                scores[ix_cd] = float(val)
        except Exception as e:
            print(f"  [경고] 관광수요 API 오류 ({ix_cd}): {e}")
        time.sleep(0.1)

    for ix_cd in CUL_RES_CODES:
        try:
            res = req.get(
                "https://apis.data.go.kr/B551011/AreaTarResDemService/areaCulResDemList",
                params={**base_params, "culResDemIxCd": ix_cd}, timeout=10
            )
            val = ET.fromstring(res.text).findtext(".//culResDemIxVal")
            if val:
                scores[ix_cd] = float(val)
        except Exception as e:
            print(f"  [경고] 문화수요 API 오류 ({ix_cd}): {e}")
        time.sleep(0.1)

    return scores


def get_hub_spots(areaCd, signguCd, baseYm="202507"):
    try:
        params = {
            "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
            "MobileOS": "AND", "MobileApp": "AppTest",
            "baseYm": baseYm, "areaCd": areaCd, "signguCd": signguCd,
        }
        res = req.get(
            "http://apis.data.go.kr/B551011/LocgoHubTarService1/areaBasedList1",
            params=params, timeout=10
        )
        spots = []
        for item in ET.fromstring(res.text).findall(".//item"):
            spots.append({
                "content_id": item.findtext("hubTatsCd"),
                "spot_name":  item.findtext("hubTatsNm"),
                "area_cd":    item.findtext("areaCd"),
                "signgu_cd":  item.findtext("signguCd"),
                "lcls_nm":    item.findtext("hubCtgryLclsNm"),
                "mcls_nm":    item.findtext("hubCtgryMclsNm"),
                "map_x":      item.findtext("mapX"),
                "map_y":      item.findtext("mapY"),
                "hub_rank":   item.findtext("hubRank"),
            })
        return spots
    except Exception as e:
        print(f"  [경고] 중심 관광지 API 오류: {e}")
        return []


def get_relations(areaCd, signguCd, baseYm="202504"):
    try:
        params = {
            "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
            "MobileOS": "AND", "MobileApp": "AppTest",
            "baseYm": baseYm, "areaCd": areaCd, "signguCd": signguCd,
        }
        res = req.get(
            "http://apis.data.go.kr/B551011/TarRlteTarService1/areaBasedList1",
            params=params, timeout=10
        )
        if res.status_code != 200 or "SERVICE_KEY_IS_NOT_REGISTERED" in res.text:
            return []
        relations = []
        for item in ET.fromstring(res.text).findall(".//item"):
            relations.append({
                "spot_nm":      item.findtext("tAtsNm"),
                "related_cd":   item.findtext("rlteTatsCd"),
                "related_nm":   item.findtext("rlteTatsNm"),
                "related_mcls": item.findtext("rlteCtgryMclsNm"),
                "rlte_rank":    item.findtext("rlteRank"),
            })
        return relations
    except Exception as e:
        print(f"  [경고] 연관 관광지 API 오류: {e}")
        return []


def get_congestion(areaCd, signguCd):
    try:
        params = {
            "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
            "MobileOS": "AND", "MobileApp": "AppTest",
            "areaCd": areaCd, "signguCd": signguCd,
        }
        res = req.get(
            "http://apis.data.go.kr/B551011/TatsCnctrRateService/tatsCnctrRatedList",
            params=params, timeout=10
        )
        if res.status_code != 200 or "SERVICE_KEY_IS_NOT_REGISTERED" in res.text:
            return {}
        congestion_map = {}
        for item in ET.fromstring(res.text).findall(".//item"):
            nm   = item.findtext("tAtsNm")
            rate = item.findtext("cnctrRate")
            if nm and rate and nm not in congestion_map:
                congestion_map[nm] = float(rate) / 100
        return congestion_map
    except Exception as e:
        print(f"  [경고] 혼잡도 API 오류: {e}")
        return {}


def get_accessible_spots(areaCd, signguCd, filters):
    if not filters:
        return set()
    try:
        params = {
            "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
            "MobileOS": "AND", "MobileApp": "AppTest",
            "areaCode": areaCd, "sigunguCode": signguCd,
        }
        res = req.get(
            "http://apis.data.go.kr/B551011/KorWithService2/areaBasedList2",
            params=params, timeout=10
        )
        accessible = set()
        for item in ET.fromstring(res.text).findall(".//item"):
            detail_res = req.get(
                "http://apis.data.go.kr/B551011/KorWithService2/detailWithTour2",
                params={
                    "serviceKey": API_KEY, "MobileOS": "AND",
                    "MobileApp": "AppTest",
                    "contentId": item.findtext("contentid"),
                },
                timeout=10
            )
            detail = ET.fromstring(detail_res.text)
            title  = item.findtext("title")
            ok = all(
                detail.findtext(f".//{f}") not in [None, ""]
                for f in filters
            )
            if ok:
                accessible.add(title)
        return accessible
    except Exception as e:
        print(f"  [경고] 무장애 API 오류: {e}")
        return set()


# ── API 엔드포인트 ─────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    추천 코스 생성 API (실시간 TourAPI 호출)

    Request Body:
    {
        "survey": {
            "경기장":       "잠실야구장",
            "여행_방식":    "경기 전",
            "이동방식":     "대중교통+도보",  // "자차+도보" / "도보 단독"
            "최대이동시간": "1시간",
            "동행":         "친구와 여행",
            "추가동행":     [],
            "컨셉":         "미식 탐방형",
            "추가조건":     ["혼잡 피하기"],
            "고정핀":       [],
            "제외조건":     [],
            "커스텀비율":   {"맛집": 30, "관광지": 40, "자연": 0, "쇼핑": 30}  // 선택사항
        }
    }

    Response:
    {
        "courses": [
            {
                "course_id": 1,
                "spots": [
                    {"name": "채빛퀴진", "category": "음식", "map_x": "...", "map_y": "..."}
                ],
                "summary": "서울 송파 미식 코스예요...",
                "tags":    ["맛집", "자연", "쇼핑"],
                "stats":   {"총 장소": 5, "맛집": 3, "관광": 1, "거리(km)": 6.0}
            }
        ],
        "user_result": {"vector": [...], "meta": {...}},
        "region":      {"areaCd": "11", "signguCd": "11710", "city": "서울 송파"}
    }
    """
    try:
        data   = request.json
        survey = data.get("survey", {})

        if not survey:
            return jsonify({"error": "survey 데이터가 없어요"}), 400

        # 경기장 → 지역코드
        stadium = survey.get("경기장", "")
        region  = STADIUM_TO_REGION.get(stadium)
        if not region:
            return jsonify({"error": f"'{stadium}'에 해당하는 지역 코드가 없어요"}), 400

        areaCd   = region["areaCd"]
        signguCd = region["signguCd"]
        city     = region["city"]

        print(f"\n[추천 요청] {stadium} ({areaCd}/{signguCd})")

        # 1. 사용자 벡터 생성 (경기장 좌표 주입)
        survey["stadium_lat"] = region.get("lat")
        survey["stadium_lng"] = region.get("lng")
        user_result = build_user_vec(survey)

        # 2. TourAPI 실시간 호출
        print("  → 지역 수요 API 호출 중...")
        scores     = get_region_scores(areaCd, signguCd)
        region_vec = build_region_vec(scores)

        print("  → 중심 관광지 API 호출 중...")
        spots = get_hub_spots(areaCd, signguCd)

        print("  → 연관 관광지 API 호출 중...")
        relations = get_relations(areaCd, signguCd)

        print("  → 혼잡도 API 호출 중...")
        congestion_map        = get_congestion(areaCd, signguCd)
        region_avg_congestion = (
            sum(congestion_map.values()) / len(congestion_map)
            if congestion_map else 0.5
        )

        # 3. 무장애 필터 (추가동행 있을 때만)
        accessibility_filters = user_result["meta"].get("accessibility", [])
        accessible_spots      = set()
        if accessibility_filters:
            print(f"  → 무장애 API 호출 중... (필터: {accessibility_filters})")
            accessible_spots = get_accessible_spots(areaCd, signguCd, accessibility_filters)

        # 4. 장소 벡터 즉시 생성
        for spot in spots:
            vec        = build_spot_vec(spot["mcls_nm"], region_vec)
            congestion = congestion_map.get(spot["spot_name"], region_avg_congestion)
            vec[-1]    = congestion
            spot["vector"] = vec

        # 5. 무장애 필터 적용
        if accessible_spots:
            spots = [s for s in spots if s["spot_name"] in accessible_spots]

        if not spots:
            return jsonify({"error": "해당 조건에 맞는 장소가 없어요"}), 404

        # 6. 필터링 → 코스 구성 → 대안 3개
        print("  → 코스 생성 중...")
        candidates  = filter_candidates(user_result, spots, relations)
        alt_courses = mmr_courses(user_result, candidates, k=3, n=5)

        # 7. 응답 구성
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

        print(f"  → 완료! 코스 {len(output)}개 생성")

        return jsonify({
            "courses":     output,
            "user_result": {
                "vector": user_result["vector"],
                "meta":   user_result["meta"],
            },
            "region": {
                "areaCd":   areaCd,
                "signguCd": signguCd,
                "city":     city,
            },
        })

    except Exception as e:
        print(f"  [오류] {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/feedback", methods=["POST"])
def feedback():
    """
    좋아요/싫어요 반영 후 재추천 API

    Request Body:
    {
        "user_result":         {"vector": [...], "meta": {...}},
        "region":              {"areaCd": "11", "signguCd": "11710", "city": "서울 송파"},
        "liked_spot_names":    ["채빛퀴진"],
        "disliked_spot_names": ["롯데월드몰"]
    }
    """
    try:
        data        = request.json
        user_result = data.get("user_result")
        region      = data.get("region")

        if not user_result or not region:
            return jsonify({"error": "user_result 또는 region이 없어요"}), 400

        areaCd   = region["areaCd"]
        signguCd = region["signguCd"]
        city     = region["city"]

        # TourAPI 재호출
        scores     = get_region_scores(areaCd, signguCd)
        region_vec = build_region_vec(scores)
        spots      = get_hub_spots(areaCd, signguCd)
        relations  = get_relations(areaCd, signguCd)
        congestion_map        = get_congestion(areaCd, signguCd)
        region_avg_congestion = (
            sum(congestion_map.values()) / len(congestion_map)
            if congestion_map else 0.5
        )

        for spot in spots:
            vec        = build_spot_vec(spot["mcls_nm"], region_vec)
            congestion = congestion_map.get(spot["spot_name"], region_avg_congestion)
            vec[-1]    = congestion
            spot["vector"] = vec

        # 좋아요/싫어요 장소 찾기
        liked_names    = data.get("liked_spot_names", [])
        disliked_names = data.get("disliked_spot_names", [])
        liked    = [s for s in spots if s["spot_name"] in liked_names]
        disliked = [s for s in spots if s["spot_name"] in disliked_names]

        # 피드백 반영 후 재추천
        updated     = apply_feedback(user_result, liked_spots=liked, disliked_spots=disliked)
        candidates  = filter_candidates(updated, spots, relations)
        alt_courses = mmr_courses(updated, candidates, k=3, n=5)

        concept = updated["meta"]["concept"]
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
                "vector": updated["vector"],
                "meta":   updated["meta"],
            },
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/survey", methods=["GET"])
def get_survey():
    """마지막 설문 불러오기 (Query Params: user_id)"""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id가 없어요"}), 400
    try:
        res = req.get(f"{BACKEND_URL}/user/survey", params={"user_id": user_id})
        return jsonify(res.json())
    except Exception:
        return jsonify({"survey": None})


@app.route("/survey", methods=["POST"])
def save_survey():
    """설문 저장 (Request Body: {"user_id": "...", "survey": {...}})"""
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
    print(f"   방식: 실시간 TourAPI 호출")
    app.run(host=host, port=port, debug=debug)