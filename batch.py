# batch.py
# 배치 스크립트 - 주기적으로 실행해서 장소 데이터 수집 및 DB 저장
# 실행: python batch.py
# 권장 주기: 월 1회 (혼잡도는 매일)

import os
import json
import time
import requests
import xml.etree.ElementTree as ET
import pymysql
from datetime import datetime
from dotenv import load_dotenv
from constants import (
    REGIONS, DIMS, SCORE_DIM_MAP, CATEGORY_VEC,
    TAR_SVC_CODES, CUL_RES_CODES,
)
from model import normalize, build_region_vec, build_spot_vec

load_dotenv()

API_KEY = os.getenv("API_KEY")
DB_CONFIG = {
    "host":    os.getenv("DB_HOST"),
    "port":    int(os.getenv("DB_PORT", 3306)),
    "user":    os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "db":      os.getenv("DB_NAME"),
    "charset": "utf8mb4",
}


# ── API 호출 함수 ──────────────────────────────

def get_region_scores(areaCd, signguCd=None, baseYm="202504"):
    scores = {}
    base_params = {
        "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
        "MobileOS": "AND", "MobileApp": "AppTest",
        "baseYm": baseYm, "areaCd": areaCd,
    }
    if signguCd:
        base_params["signguCd"] = signguCd

    for ix_cd in TAR_SVC_CODES:
        try:
            res = requests.get(
                "https://apis.data.go.kr/B551011/AreaTarResDemService/areaTarSvcDemList",
                params={**base_params, "tarSvcDemIxCd": ix_cd},
                timeout=10
            )
            val = ET.fromstring(res.text).findtext(".//tarSvcDemIxVal")
            if val:
                scores[ix_cd] = float(val)
        except Exception as e:
            print(f"  [경고] 관광수요 API 오류 ({ix_cd}): {e}")
        time.sleep(0.1)

    for ix_cd in CUL_RES_CODES:
        try:
            res = requests.get(
                "https://apis.data.go.kr/B551011/AreaTarResDemService/areaCulResDemList",
                params={**base_params, "culResDemIxCd": ix_cd},
                timeout=10
            )
            val = ET.fromstring(res.text).findtext(".//culResDemIxVal")
            if val:
                scores[ix_cd] = float(val)
        except Exception as e:
            print(f"  [경고] 문화수요 API 오류 ({ix_cd}): {e}")
        time.sleep(0.1)

    return scores


def get_congestion(areaCd, signguCd):
    try:
        params = {
            "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
            "MobileOS": "AND", "MobileApp": "AppTest",
            "areaCd": areaCd, "signguCd": signguCd,
        }
        res = requests.get(
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


def get_hub_spots(areaCd, signguCd, baseYm="202507"):
    try:
        params = {
            "serviceKey": API_KEY, "pageNo": 1, "numOfRows": 100,
            "MobileOS": "AND", "MobileApp": "AppTest",
            "baseYm": baseYm, "areaCd": areaCd, "signguCd": signguCd,
        }
        res = requests.get(
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
        res = requests.get(
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


# ── DB 저장 함수 ───────────────────────────────

def save_spots_to_db(spots):
    """spot_cache 테이블에 장소 데이터 저장 (중복 시 업데이트)"""
    conn   = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    now    = datetime.now()

    for spot in spots:
        cursor.execute("""
            INSERT INTO spot_cache
                (content_id, spot_name, area_cd, signgu_cd,
                 lcls_nm, mcls_nm, map_x, map_y, hub_rank,
                 vector, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                vector     = VALUES(vector),
                hub_rank   = VALUES(hub_rank),
                updated_at = VALUES(updated_at)
        """, (
            spot["content_id"],
            spot["spot_name"],
            spot["area_cd"],
            spot["signgu_cd"],
            spot["lcls_nm"],
            spot["mcls_nm"],
            spot["map_x"],
            spot["map_y"],
            spot["hub_rank"],
            json.dumps(spot["vector"]),
            now,
        ))

    conn.commit()
    conn.close()
    print(f"  → spot_cache {len(spots)}건 저장 완료")


def save_relations_to_db(relations):
    """spot_relation 테이블에 연관 관광지 저장 (전체 재적재)"""
    conn   = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM spot_relation")

    for r in relations:
        cursor.execute("""
            INSERT INTO spot_relation
                (spot_nm, related_cd, related_nm, related_mcls, rlte_rank)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            r["spot_nm"],
            r["related_cd"],
            r["related_nm"],
            r["related_mcls"],
            r["rlte_rank"],
        ))

    conn.commit()
    conn.close()
    print(f"  → spot_relation {len(relations)}건 저장 완료")


# ── 메인 배치 실행 ─────────────────────────────

def run_batch(save_to_db=False):
    """
    Parameters
    ----------
    save_to_db : bool
        True  → DB에 직접 저장 (백엔드 연동 후)
        False → JSON 파일로 저장 (백엔드 연동 전)
    """
    print(f"[{datetime.now()}] 배치 시작")
    all_spots     = []
    all_relations = []

    for areaCd, signguCd, name in REGIONS:
        print(f"\n=== {name} ({areaCd}/{signguCd}) ===")

        scores     = get_region_scores(areaCd, signguCd)
        region_vec = build_region_vec(scores)
        print(f"  지역 벡터 수집: {len(scores)}개 지표")

        congestion_map        = get_congestion(areaCd, signguCd)
        region_avg_congestion = (
            sum(congestion_map.values()) / len(congestion_map)
            if congestion_map else 0.5
        )
        print(f"  혼잡도 수집: {len(congestion_map)}개 장소")
        time.sleep(0.3)

        spots = get_hub_spots(areaCd, signguCd)
        print(f"  중심 관광지: {len(spots)}개")

        for spot in spots:
            vec        = build_spot_vec(spot["mcls_nm"], region_vec)
            congestion = congestion_map.get(spot["spot_name"], region_avg_congestion)
            vec[-1]    = congestion
            spot["vector"] = vec
            all_spots.append(spot)

        time.sleep(0.3)

        relations = get_relations(areaCd, signguCd)
        print(f"  연관 관광지: {len(relations)}개")
        all_relations.extend(relations)

        time.sleep(0.5)

    print(f"\n✅ 수집 완료")
    print(f"   총 장소:     {len(all_spots)}개")
    print(f"   총 연관관계: {len(all_relations)}개")

    if save_to_db:
        # 백엔드 연동 후 활성화
        print("\n📦 DB 저장 중...")
        save_spots_to_db(all_spots)
        save_relations_to_db(all_relations)
    else:
        # 백엔드 연동 전 JSON 파일로 저장
        with open("spots.json", "w", encoding="utf-8") as f:
            json.dump(all_spots, f, ensure_ascii=False, indent=2)
        with open("relations.json", "w", encoding="utf-8") as f:
            json.dump(all_relations, f, ensure_ascii=False, indent=2)
        print("\n📁 spots.json, relations.json 저장 완료")

    print(f"[{datetime.now()}] 배치 종료")


if __name__ == "__main__":
    # save_to_db=True → DB에 직접 저장 (백엔드 연동 후)
    # save_to_db=False → JSON 파일로 저장 (현재 단계)
    run_batch(save_to_db=False)
