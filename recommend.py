# recommend.py
# Flask API 서버 - 실시간 TourAPI 호출 방식
# 실행: python recommend.py

import os
import time
import math
import requests as req
import xml.etree.ElementTree as ET
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from model import (
    build_user_vec, build_spot_vec, build_region_vec,
    filter_candidates, mmr_courses, generate_summary, apply_feedback,
    assign_times, build_multi_day_courses,
)
from constants import TAR_SVC_CODES, CUL_RES_CODES

load_dotenv()

app         = Flask(__name__)
CORS(app)

API_KEY     = os.getenv("API_KEY")
KAKAO_KEY   = os.getenv("KAKAO_API_KEY", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

TRANSPORT_RADIUS_MAP = {
    "대중교통+도보": 5,
    "자차+도보":    15,
    "도보 단독":     2,
}

# ── 경기장 → 지역코드 매핑 ───────────────────
STADIUM_TO_REGION = {

    # ── 서울 ──────────────────────────────────
    "서울종합운동장야구장":         {"areaCd": "11", "signguCd": "11710", "city": "서울 송파",    "lat": 37.5121513808403,   "lng": 127.071909507224,  "api_name": "잠실야구장"},
    "서울특별시교육청학생체육관":   {"areaCd": "11", "signguCd": "11710", "city": "서울 송파",    "lat": 37.51219787219792,  "lng": 127.07537857414752},
    "고척스카이돔":                 {"areaCd": "11", "signguCd": "11530", "city": "서울 구로",    "lat": 37.49821220764421,  "lng": 126.8670889679075, "api_name": "고척스카이돔"},
    "장충체육관":                   {"areaCd": "11", "signguCd": "11140", "city": "서울 중구",    "lat": 37.558178171371,    "lng": 127.006808757736},
    "서울월드컵경기장":             {"areaCd": "11", "signguCd": "11440", "city": "서울 마포",    "lat": 37.56825003712418,  "lng": 126.89724365713197, "api_name": "서울월드컵경기장"},
    "목동운동장 주경기장":          {"areaCd": "11", "signguCd": "11470", "city": "서울 양천",    "lat": 37.5304813965458,   "lng": 126.883040410551,  "api_name": "목동주경기장"},

    # ── 인천 ──────────────────────────────────
    "인천SSG랜더스필드":            {"areaCd": "28", "signguCd": "28177", "city": "인천 미추홀",  "lat": 37.436998685442084, "lng": 126.69327612453377, "api_name": "인천문학경기장/동문광장"},
    "인천삼산월드체육관":           {"areaCd": "28", "signguCd": "28237", "city": "인천 부평",    "lat": 37.50800280504626,  "lng": 126.73832589829678, "api_name": "삼산월드체육관/축구장"},
    "계양체육관":                   {"areaCd": "28", "signguCd": "28245", "city": "인천 계양",    "lat": 37.5339610690414,   "lng": 126.748058093851},
    "인천축구전용경기장":           {"areaCd": "28", "signguCd": "28110", "city": "인천 중구",    "lat": 37.466162868183204, "lng": 126.64300764788254},
    "인천도원체육관":               {"areaCd": "28", "signguCd": "28110", "city": "인천 중구",    "lat": 37.4662778536466,   "lng": 126.640813029151},

    # ── 경기도 ────────────────────────────────
    "수원KT위즈파크":               {"areaCd": "41", "signguCd": "41111", "city": "수원 장안",    "lat": 37.2997302532973,   "lng": 127.009772045935},
    "수원실내체육관":               {"areaCd": "41", "signguCd": "41111", "city": "수원 장안",    "lat": 37.2983643371609,   "lng": 127.009072589574},
    "수원종합운동장 주경기장":      {"areaCd": "41", "signguCd": "41111", "city": "수원 장안",    "lat": 37.297755038633156, "lng": 127.01136094698745, "api_name": "수원종합운동장/인조잔디구장"},
    "화성실내체육관":               {"areaCd": "41", "signguCd": "41590", "city": "화성 만세",    "lat": 37.13830760228957,  "lng": 126.92247625610617},
    "이충문화체육센터":             {"areaCd": "41", "signguCd": "41150", "city": "평택",          "lat": 37.06601927536289,  "lng": 127.07072607979842},
    "부천종합운동장":               {"areaCd": "41", "signguCd": "41192", "city": "부천 원미",    "lat": 37.50254894022013,  "lng": 126.79901040032861},
    "부천체육관":                   {"areaCd": "41", "signguCd": "41192", "city": "부천 원미",    "lat": 37.513420835860586, "lng": 126.7632385988074},
    "안양종합운동장":               {"areaCd": "41", "signguCd": "41173", "city": "안양 동안",    "lat": 37.405329029129256, "lng": 126.94651386558405},
    "안양정관장아레나":             {"areaCd": "41", "signguCd": "41173", "city": "안양 동안",    "lat": 37.4050523816749,   "lng": 126.948465782089},
    "고양소노아레나":               {"areaCd": "41", "signguCd": "41287", "city": "고양 일산서",  "lat": 37.6745773792369,   "lng": 126.741820500325,  "api_name": "고양종합운동장/보조경기장"},
    "수원KT소닉붐아레나":           {"areaCd": "41", "signguCd": "41113", "city": "수원 권선",    "lat": 37.276272539357,    "lng": 126.948290984046},
    "용인실내체육관":               {"areaCd": "41", "signguCd": "41461", "city": "용인 처인",    "lat": 37.23740975113005,  "lng": 127.21341259333057},
    "용인미르스타디움":             {"areaCd": "41", "signguCd": "41461", "city": "용인 처인",    "lat": 37.24968677953305,  "lng": 127.16532948766518},
    "김포솔터축구장":               {"areaCd": "41", "signguCd": "41570", "city": "김포",          "lat": 37.6408457983481,   "lng": 126.649967481082,  "api_name": "김포솔터축구장"},
    "탄천종합운동장 주경기장":      {"areaCd": "41", "signguCd": "41135", "city": "성남 분당",    "lat": 37.4104126665704,   "lng": 127.120662823288},
    "수원월드컵경기장":             {"areaCd": "41", "signguCd": "41115", "city": "수원 팔달",    "lat": 37.2864976648853,   "lng": 127.036920677186,  "api_name": "수원월드컵경기장"},
    "안산와~스타디움":              {"areaCd": "41", "signguCd": "41273", "city": "안산 단원",    "lat": 37.31934057443121,  "lng": 126.81864453861768},
    "파주스타디움":                 {"areaCd": "41", "signguCd": "41480", "city": "파주",          "lat": 37.7561525640414,   "lng": 126.785603115115},
    "화성종합경기타운 주경기장":    {"areaCd": "41", "signguCd": "41590", "city": "화성",          "lat": 37.137448439984546, "lng": 126.9245705199317},

    # ── 대전 ──────────────────────────────────
    "대전한화생명볼파크":           {"areaCd": "30", "signguCd": "30140", "city": "대전 중구",    "lat": 36.3161617310226,   "lng": 127.431535001435,  "api_name": "대전한화생명볼파크"},
    "충무체육관":                   {"areaCd": "30", "signguCd": "30140", "city": "대전 중구",    "lat": 36.3180130202897,   "lng": 127.430460586297},
    "대전월드컵경기장":             {"areaCd": "30", "signguCd": "30200", "city": "대전 유성",    "lat": 36.365171091983576, "lng": 127.32513866896132, "api_name": "대전월드컵경기장"},

    # ── 광주 ──────────────────────────────────
    "광주기아챔피언스필드":         {"areaCd": "29", "signguCd": "29170", "city": "광주 북구",    "lat": 35.16820922209541,  "lng": 126.88911206152956},
    "SOOP스타디움":                 {"areaCd": "29", "signguCd": "29140", "city": "광주 서구",    "lat": 35.13539260200561,  "lng": 126.8788644463333},
    "광주염주체육관":               {"areaCd": "29", "signguCd": "29140", "city": "광주 서구",    "lat": 35.13539260200561,  "lng": 126.8788644463333},
    "광주월드컵경기장":             {"areaCd": "29", "signguCd": "29140", "city": "광주 서구",    "lat": 35.13368228982632,  "lng": 126.87489504742325, "api_name": "광주월드컵경기장"},

    # ── 부산 ──────────────────────────────────
    "사직야구장":                   {"areaCd": "26", "signguCd": "26260", "city": "부산 동래",    "lat": 35.194017568250274, "lng": 129.06154402103502, "api_name": "사직야구장"},
    "사직실내체육관":               {"areaCd": "26", "signguCd": "26260", "city": "부산 동래",    "lat": 35.1924185304639,   "lng": 129.0607198031},
    "강서실내체육관":               {"areaCd": "26", "signguCd": "26440", "city": "부산 강서",    "lat": 35.2101315792417,   "lng": 128.97223684359},
    "부산강서체육관":               {"areaCd": "26", "signguCd": "26440", "city": "부산 강서",    "lat": 35.2101315792417,   "lng": 128.97223684359},
    "구덕운동장":                   {"areaCd": "26", "signguCd": "26140", "city": "부산 서구",    "lat": 35.116546389784666, "lng": 129.01450666537704},

    # ── 대구 ──────────────────────────────────
    "대구삼성라이온즈파크":         {"areaCd": "27", "signguCd": "27260", "city": "대구 수성",    "lat": 35.8410595632468,   "lng": 128.681659448344},
    "대구체육관":                   {"areaCd": "27", "signguCd": "27230", "city": "대구 북구",    "lat": 35.8934361897145,   "lng": 128.603454695703},
    "대구실내체육관":               {"areaCd": "27", "signguCd": "27230", "city": "대구 북구",    "lat": 35.8934361897145,   "lng": 128.603454695703},
    "대구iM뱅크파크":               {"areaCd": "27", "signguCd": "27230", "city": "대구 북구",    "lat": 35.881249474718,    "lng": 128.588242697948},

    # ── 경남 ──────────────────────────────────
    "창원NC파크":                   {"areaCd": "48", "signguCd": "48127", "city": "창원 마산회원", "lat": 35.22280070751199,  "lng": 128.5820053292696},
    "창원체육관":                   {"areaCd": "48", "signguCd": "48123", "city": "창원 성산",    "lat": 35.2327367366309,   "lng": 128.666283189427},
    "창원실내체육관":               {"areaCd": "48", "signguCd": "48123", "city": "창원 성산",    "lat": 35.2327367366309,   "lng": 128.666283189427},
    "창원축구센터":                 {"areaCd": "48", "signguCd": "48123", "city": "창원 성산",    "lat": 35.223373624431055, "lng": 128.7057039457541},
    "김해종합운동장":               {"areaCd": "48", "signguCd": "48250", "city": "김해",          "lat": 35.25765996521216,  "lng": 128.87529350576827},

    # ── 경북 ──────────────────────────────────
    "김천실내체육관":               {"areaCd": "47", "signguCd": "47150", "city": "김천",          "lat": 36.14291691823165,  "lng": 128.0868523538595},
    "김천종합스포츠타운":           {"areaCd": "47", "signguCd": "47150", "city": "김천",          "lat": 36.14291691823165,  "lng": 128.0868523538595, "api_name": "김천종합스포츠타운/배드민턴경기장"},
    "포항스틸야드":                 {"areaCd": "47", "signguCd": "47111", "city": "포항 남구",    "lat": 35.9977222824466,   "lng": 129.38441519469,   "api_name": "포항스틸야드"},

    # ── 충남 ──────────────────────────────────
    "유관순체육관":                 {"areaCd": "44", "signguCd": "44133", "city": "천안 서북",    "lat": 36.82087703646577,  "lng": 127.11422320390537},
    "천안유관순체육관":             {"areaCd": "44", "signguCd": "44133", "city": "천안 서북",    "lat": 36.82087703646577,  "lng": 127.11422320390537},
    "천안종합운동장":               {"areaCd": "44", "signguCd": "44133", "city": "천안 서북",    "lat": 36.8187937524983,   "lng": 127.115074152739},
    "아산이순신체육관":             {"areaCd": "44", "signguCd": "44200", "city": "아산",          "lat": 36.76952716220382,  "lng": 127.02446247383006},
    "이순신종합운동장":             {"areaCd": "44", "signguCd": "44200", "city": "아산",          "lat": 36.7681868495457,   "lng": 127.021621583184},

    # ── 충북 ──────────────────────────────────
    "청주체육관":                   {"areaCd": "43", "signguCd": "43112", "city": "청주 서원",    "lat": 36.63657016468344,  "lng": 127.47344511906337},
    "청주종합경기장":               {"areaCd": "43", "signguCd": "43112", "city": "청주 서원",    "lat": 36.637825214953,    "lng": 127.472365950612},

    # ── 강원 ──────────────────────────────────
    "강릉하이원아레나":             {"areaCd": "51", "signguCd": "51150", "city": "강릉",          "lat": 37.77365338873246,  "lng": 128.8975709883576},
    "강릉아레나":                   {"areaCd": "51", "signguCd": "51150", "city": "강릉",          "lat": 37.77365338873246,  "lng": 128.8975709883576},
    "원주DB프로미아레나":           {"areaCd": "51", "signguCd": "51130", "city": "원주",          "lat": 37.339049803957,    "lng": 127.94209670124236},

    # ── 울산 ──────────────────────────────────
    "울산문수축구경기장":           {"areaCd": "31", "signguCd": "31140", "city": "울산 남구",    "lat": 35.53528362130463,  "lng": 129.2595358045965, "api_name": "문수월드컵경기장"},
    "울산동천체육관":               {"areaCd": "31", "signguCd": "31110", "city": "울산 중구",    "lat": 35.562344053715,    "lng": 129.350433515541},

    # ── 전북 ──────────────────────────────────
    "전주월드컵경기장":             {"areaCd": "52", "signguCd": "52113", "city": "전주 덕진",    "lat": 35.86814739484495,  "lng": 127.064497525143,  "api_name": "전주월드컵경기장"},

    # ── 전남 ──────────────────────────────────
    "광양축구전용구장":             {"areaCd": "46", "signguCd": "46230", "city": "광양",          "lat": 34.9331123887351,   "lng": 127.727482914576},

    # ── 제주 ──────────────────────────────────
    "제주월드컵경기장":             {"areaCd": "50", "signguCd": "50130", "city": "제주 서귀포",  "lat": 33.246151627502,    "lng": 126.509381090559},
}


# ── 카카오 좌표 보완 ───────────────────────────
_coord_cache = {}

def fill_coords(spots, center_lat=None, center_lng=None, max_dist_km=20):
    """
    map_x/map_y 없는 장소 카카오 API로 좌표 보완
    center_lat/lng 있으면 가장 가까운 결과 선택 (다른 지역 동명 장소 방지)
    """
    if not KAKAO_KEY:
        return spots

    def haversine(lat1, lng1, lat2, lng2):
        import math
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
        return R * 2 * math.asin(math.sqrt(a))

    for spot in spots:
        if spot.get("map_x") and spot.get("map_y"):
            continue
        name = spot["spot_name"]
        if name in _coord_cache:
            spot["map_x"], spot["map_y"] = _coord_cache[name]
            continue
        try:
            params = {"query": name, "size": 5}
            # 중심 좌표 있으면 반경 검색
            if center_lat and center_lng:
                params.update({
                    "x": str(center_lng),
                    "y": str(center_lat),
                    "radius": int(max_dist_km * 1000),
                })
            res = req.get(
                "https://dapi.kakao.com/v2/local/search/keyword.json",
                headers={"Authorization": f"KakaoAK {KAKAO_KEY}"},
                params=params,
                timeout=5
            )
            docs = res.json().get("documents", [])
            if not docs:
                continue

            # 중심 좌표 있으면 가장 가까운 결과 선택
            if center_lat and center_lng and len(docs) > 1:
                docs.sort(key=lambda d: haversine(
                    center_lat, center_lng,
                    float(d["y"]), float(d["x"])
                ))
                # 최대 반경 초과 결과 제외
                docs = [d for d in docs if haversine(
                    center_lat, center_lng,
                    float(d["y"]), float(d["x"])
                ) <= max_dist_km]
                if not docs:
                    continue

            lng = docs[0]["x"]
            lat = docs[0]["y"]
            spot["map_x"] = lng
            spot["map_y"] = lat
            _coord_cache[name] = (lng, lat)
        except Exception:
            pass
        time.sleep(0.05)
    return spots


def get_origin_coords(origin_text):
    """출발지 텍스트 → 카카오 API 좌표 변환 (도로명주소 → 일반주소 → 장소명)"""
    if not origin_text or not KAKAO_KEY:
        return None, None
    try:
        res = req.get(
            "https://dapi.kakao.com/v2/local/search/address.json",
            headers={"Authorization": f"KakaoAK {KAKAO_KEY}"},
            params={"query": origin_text, "size": 1},
            timeout=5
        )
        docs = res.json().get("documents", [])
        if docs:
            return float(docs[0]["y"]), float(docs[0]["x"])
    except Exception as e:
        print(f"  [경고] 출발지 주소 검색 실패: {e}")
    try:
        res = req.get(
            "https://dapi.kakao.com/v2/local/search/keyword.json",
            headers={"Authorization": f"KakaoAK {KAKAO_KEY}"},
            params={"query": origin_text, "size": 1},
            timeout=5
        )
        docs = res.json().get("documents", [])
        if docs:
            return float(docs[0]["y"]), float(docs[0]["x"])
    except Exception as e:
        print(f"  [경고] 출발지 장소명 검색 실패: {e}")
    return None, None


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
            print(f"  [경고] 관광수요 ({ix_cd}): {e}")
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
            print(f"  [경고] 문화수요 ({ix_cd}): {e}")
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
        print(f"  [경고] 중심 관광지: {e}")
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
        print(f"  [경고] 연관 관광지: {e}")
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
        print(f"  [경고] 혼잡도: {e}")
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
        print(f"  [경고] 무장애: {e}")
        return set()


# ── 공통 spots 준비 함수 ───────────────────────

def prepare_spots(survey, region, areaCd, signguCd, api_name, user_result, region_vec):
    """TourAPI 호출 + 벡터 생성 + 경기장 강제 추가 + 고정핀 추가"""

    print("  → 중심 관광지 API...")
    spots = get_hub_spots(areaCd, signguCd)

    print("  → 연관 관광지 API...")
    relations = get_relations(areaCd, signguCd)

    print("  → 혼잡도 API...")
    congestion_map        = get_congestion(areaCd, signguCd)
    region_avg_congestion = (
        sum(congestion_map.values()) / len(congestion_map)
        if congestion_map else 0.5
    )

    # 무장애 필터
    accessibility_filters = user_result["meta"].get("accessibility", [])
    accessible_spots      = set()
    if accessibility_filters:
        print(f"  → 무장애 API... ({accessibility_filters})")
        accessible_spots = get_accessible_spots(areaCd, signguCd, accessibility_filters)

    # 장소 벡터 생성
    for spot in spots:
        vec        = build_spot_vec(spot["mcls_nm"], region_vec)
        congestion = congestion_map.get(spot["spot_name"], region_avg_congestion)
        vec[-1]    = congestion
        spot["vector"] = vec

    # 음식점 좌표 사전 보완 (카카오 API)
    # 연관 관광지 API에서 온 음식점들 이름으로 좌표 검색
    if KAKAO_KEY:
        no_coord_food = [
            s for s in spots
            if s["mcls_nm"] in ["음식", "기타관광"]
            and (not s.get("map_x") or not s.get("map_y"))
        ]
        if no_coord_food:
            print(f"  → 음식점 좌표 보완: {len(no_coord_food)}개")
            fill_coords(no_coord_food, center_lat=region.get("lat"), center_lng=region.get("lng"))

    # 무장애 필터 적용
    if accessible_spots:
        spots = [s for s in spots if s["spot_name"] in accessible_spots]

    # 고정핀 카카오 검색 후 후보에 강제 추가
    # 반경 제한은 백엔드에서 60km로 처리
    user_fixed_pins = [p for p in survey.get("고정핀", []) if p != survey.get("경기장")]

    for pin_name in user_fixed_pins:
        already = any(pin_name in s["spot_name"] for s in spots)
        if already or not KAKAO_KEY:
            continue
        try:
            kres = req.get(
                "https://dapi.kakao.com/v2/local/search/keyword.json",
                headers={"Authorization": f"KakaoAK {KAKAO_KEY}"},
                params={"query": pin_name, "size": 1},
                timeout=5
            )
            docs = kres.json().get("documents", [])
            if not docs:
                print(f"  [경고] 고정핀 검색 결과 없음: {pin_name}")
                continue

            d   = docs[0]
            lng = float(d["x"])
            lat = float(d["y"])

            pin_spot = {
                "content_id": f"pin_{pin_name}",
                "spot_name":  pin_name,
                "area_cd":    areaCd,
                "signgu_cd":  signguCd,
                "lcls_nm":    "관광지",
                "mcls_nm":    "기타관광",
                "map_x":      str(lng),
                "map_y":      str(lat),
                "hub_rank":   "1",
                "vector":     build_spot_vec("기타관광", region_vec),
            }
            spots.append(pin_spot)
            print(f"  → 고정핀 추가: {pin_name}")

        except Exception as e:
            print(f"  [경고] 고정핀 검색 실패 ({pin_name}): {e}")

    # 경기장 강제 추가
    existing_names = {s["spot_name"] for s in spots}
    if api_name not in existing_names:
        stadium_spot = {
            "content_id": f"stadium_{signguCd}",
            "spot_name":  api_name,
            "area_cd":    areaCd,
            "signgu_cd":  signguCd,
            "lcls_nm":    "관광지",
            "mcls_nm":    "문화관광",
            "map_x":      str(region["lng"]),
            "map_y":      str(region["lat"]),
            "hub_rank":   "1",
            "vector":     build_spot_vec("문화관광", region_vec),
        }
        stadium_spot["vector"][-1] = 0.9
        spots.append(stadium_spot)
        print(f"  → 경기장 강제 추가: {api_name}")
    else:
        print(f"  → 경기장 확인: {api_name}")

    return spots, relations


def format_course_spots(course):
    return [
        {
            "name":           s["spot_name"],
            "category":       s["mcls_nm"],
            "map_x":          s.get("map_x"),
            "map_y":          s.get("map_y"),
            "arrival_time":   s.get("arrival_time"),
            "departure_time": s.get("departure_time"),
        }
        for s in course
    ]


# ── API 엔드포인트 ─────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    추천 코스 생성 API

    Request Body:
    {
        "survey": {
            "경기장":           "서울종합운동장야구장",
            "출발지":           "서울역",
            "여행기간":         "당일치기",
            "여행_방식":        "경기 전",
            "경기시간":         "18:30",
            "도착희망시간":     "1시간 전",
            "출발희망시간":     "10:00",
            "연전관람여부":     "아니오",
            "추가관람경기_일정": [],
            "이동방식":         "대중교통+도보",
            "최대이동시간":     "1시간",
            "걷는거리":         "상관없음",
            "동행":             "친구와 여행",
            "추가동행":         [],
            "컨셉":             "미식 탐방형",
            "추가조건":         [],
            "고정핀":           [],
            "제외장소":         [],
            "제외조건":         [],
            "커스텀비율":       null
        }
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
        api_name = region.get("api_name", stadium)

        print(f"\n[추천 요청] {stadium} ({areaCd}/{signguCd}) / {survey.get('여행기간','당일치기')}")

        # 출발지 좌표 변환
        origin_text = survey.get("출발지", "")
        if origin_text:
            origin_lat, origin_lng = get_origin_coords(origin_text)
            survey["origin_lat"] = origin_lat
            survey["origin_lng"] = origin_lng
            print(f"  → 출발지: {origin_text} ({origin_lat}, {origin_lng})")

        # 사용자 벡터 생성
        survey["stadium_lat"]       = region.get("lat")
        survey["stadium_lng"]       = region.get("lng")
        survey["all_stadiums"]      = set(STADIUM_TO_REGION.keys())
        survey["selected_stadium"]  = stadium
        survey["selected_api_name"] = api_name

        if stadium not in survey.get("고정핀", []):
            survey["고정핀"] = survey.get("고정핀", []) + [stadium]

        user_result = build_user_vec(survey)

        # 고정핀 api_name으로 교체
        user_result["meta"]["fixed_pins"] = [
            api_name if p == stadium else p
            for p in user_result["meta"]["fixed_pins"]
        ]

        # 지역 수요 API
        print("  → 지역 수요 API...")
        scores     = get_region_scores(areaCd, signguCd)
        region_vec = build_region_vec(scores)

        # spots 준비 (고정핀 + 경기장 포함)
        try:
            spots, relations = prepare_spots(
                survey, region, areaCd, signguCd, api_name, user_result, region_vec
            )
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        if not spots:
            return jsonify({"error": "해당 조건에 맞는 장소가 없어요"}), 404

        # 필터링
        print("  → 코스 생성...")

        # relations 음식점 좌표 카카오로 보완 (filter_candidates에서 좌표없는 장소 제외 대비)
        if KAKAO_KEY:
            relation_food_names = list({
                r["related_nm"] for r in relations
                if r.get("related_mcls") == "음식" and r.get("related_nm")
            })
            if relation_food_names:
                temp_spots = [{"spot_name": n, "mcls_nm": "음식", "map_x": None, "map_y": None} for n in relation_food_names]
                fill_coords(temp_spots, center_lat=region.get("lat"), center_lng=region.get("lng"))
                coord_map = {s["spot_name"]: (s.get("map_x"), s.get("map_y")) for s in temp_spots}
                # relations에 좌표 정보 주입 (filter_candidates에서 extra_spots 생성 시 활용)
                for r in relations:
                    if r.get("related_mcls") == "음식" and r.get("related_nm") in coord_map:
                        r["map_x"], r["map_y"] = coord_map[r["related_nm"]]

        candidates = filter_candidates(user_result, spots, relations)
        trip_days  = user_result["meta"]["trip_days"]
        concept    = user_result["meta"]["concept"]
        transport  = user_result["meta"]["transport"]
        output     = []

        if trip_days == 1:
            # 당일치기
            alt_courses = mmr_courses(user_result, candidates, k=3, n=5)
            for i, course in enumerate(alt_courses, 1):
                fill_coords(course)
                course_timed = assign_times(
                    course,
                    start_time     = user_result["meta"]["depart_time"],
                    transport      = transport,
                    game_deadline  = user_result["meta"]["game_deadline"],
                    game_spot_name = api_name,
                )
                summary = generate_summary(course, city, concept)
                output.append({
                    "course_id": i,
                    "days": [{
                        "day":       1,
                        "has_game":  bool(user_result["meta"]["game_time"]),
                        "game_time": user_result["meta"]["game_time"],
                        "arrive_by": user_result["meta"]["game_deadline"],
                        "spots":     format_course_spots(course_timed),
                    }],
                    "summary": summary["summary"],
                    "tags":    summary["tags"],
                    "stats":   summary["stats"],
                })

        else:
            # 다박 여행
            multi_courses = build_multi_day_courses(
                user_result, candidates, api_name, k=3
            )
            for i, daily in enumerate(multi_courses, 1):
                all_spots = [s for day in daily for s in day["spots"]]
                fill_coords(all_spots)
                summary = generate_summary(all_spots, city, concept)
                output.append({
                    "course_id": i,
                    "days": [
                        {
                            "day":       d["day"],
                            "has_game":  d["has_game"],
                            "game_time": d.get("game_time"),
                            "arrive_by": d.get("arrive_by"),
                            "spots":     format_course_spots(d["spots"]),
                        }
                        for d in daily
                    ],
                    "summary": summary["summary"],
                    "tags":    summary["tags"],
                    "stats":   summary["stats"],
                })

        print(f"  → 완료! {trip_days}일 코스 {len(output)}개 생성")

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
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/feedback", methods=["POST"])
def feedback():
    """
    좋아요/싫어요 반영 후 재추천

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
        region_info = data.get("region")

        if not user_result or not region_info:
            return jsonify({"error": "user_result 또는 region이 없어요"}), 400

        areaCd   = region_info["areaCd"]
        signguCd = region_info["signguCd"]
        city     = region_info["city"]
        api_name = user_result["meta"].get("selected_api_name", "")

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

        # 경기장 강제 추가
        if api_name:
            existing_names = {s["spot_name"] for s in spots}
            if api_name not in existing_names:
                lat = user_result["meta"].get("stadium_lat", 0)
                lng = user_result["meta"].get("stadium_lng", 0)
                stadium_spot = {
                    "content_id": f"stadium_{signguCd}",
                    "spot_name":  api_name,
                    "area_cd":    areaCd,
                    "signgu_cd":  signguCd,
                    "lcls_nm":    "관광지",
                    "mcls_nm":    "문화관광",
                    "map_x":      str(lng),
                    "map_y":      str(lat),
                    "hub_rank":   "1",
                    "vector":     build_spot_vec("문화관광", region_vec),
                }
                stadium_spot["vector"][-1] = 0.9
                spots.append(stadium_spot)

        # 피드백 반영
        liked_names    = data.get("liked_spot_names", [])
        disliked_names = data.get("disliked_spot_names", [])
        liked    = [s for s in spots if s["spot_name"] in liked_names]
        disliked = [s for s in spots if s["spot_name"] in disliked_names]

        updated    = apply_feedback(user_result, liked_spots=liked, disliked_spots=disliked)
        candidates = filter_candidates(updated, spots, relations)
        trip_days  = updated["meta"]["trip_days"]
        concept    = updated["meta"]["concept"]
        transport  = updated["meta"]["transport"]
        output     = []

        if trip_days == 1:
            alt_courses = mmr_courses(updated, candidates, k=3, n=5)
            for i, course in enumerate(alt_courses, 1):
                fill_coords(course)
                course_timed = assign_times(
                    course,
                    start_time     = updated["meta"]["depart_time"],
                    transport      = transport,
                    game_deadline  = updated["meta"]["game_deadline"],
                    game_spot_name = api_name,
                )
                summary = generate_summary(course, city, concept)
                output.append({
                    "course_id": i,
                    "days": [{
                        "day":       1,
                        "has_game":  bool(updated["meta"]["game_time"]),
                        "game_time": updated["meta"]["game_time"],
                        "arrive_by": updated["meta"]["game_deadline"],
                        "spots":     format_course_spots(course_timed),
                    }],
                    "summary": summary["summary"],
                    "tags":    summary["tags"],
                    "stats":   summary["stats"],
                })
        else:
            multi_courses = build_multi_day_courses(updated, candidates, api_name, k=3)
            for i, daily in enumerate(multi_courses, 1):
                all_spots = [s for day in daily for s in day["spots"]]
                fill_coords(all_spots)
                summary = generate_summary(all_spots, city, concept)
                output.append({
                    "course_id": i,
                    "days": [
                        {
                            "day":       d["day"],
                            "has_game":  d["has_game"],
                            "game_time": d.get("game_time"),
                            "arrive_by": d.get("arrive_by"),
                            "spots":     format_course_spots(d["spots"]),
                        }
                        for d in daily
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
        print(f"  [오류] {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/survey", methods=["GET"])
def get_survey():
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