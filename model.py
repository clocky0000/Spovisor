# model.py
# 추천 모델 핵심 로직

import numpy as np
import random
from constants import (
    DIMS, CATEGORY_VEC, SCORE_DIM_MAP,
    CONCEPT_VEC, COMPANION_ADJUST, EXTRA_ADJUST,
    RATIO_MAP, RATIO_CATEGORY_MAP,
    TRANSPORT_RADIUS, MAX_SPOT_COUNT, MAX_WALK_MINUTES,
    ACCESSIBILITY_FILTER, EXCLUDE_CATEGORY_MAP,
    CONCEPT_CATEGORY_MAP, SUMMARY_TEMPLATES, CAT_LABEL,
)


# ── 공통 유틸 ──────────────────────────────────

def normalize(vec):
    total = sum(vec)
    if total == 0:
        return vec
    return [v / total for v in vec]


def cosine_sim(a, b):
    a, b = np.array(a), np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# ── 장소 벡터 생성 ─────────────────────────────

def build_spot_vec(mcls_nm, region_vec={}):
    base = CATEGORY_VEC.get(mcls_nm, CATEGORY_VEC["기타관광"]).copy()
    for i, dim in enumerate(DIMS[:-1]):
        if region_vec.get(dim, 0) > 0:
            base[i] *= (1 + region_vec[dim])
    base_norm = normalize(base[:-1])
    return base_norm + [base[-1]]


def build_region_vec(scores):
    vec = {dim: 0.0 for dim in DIMS}
    for code, val in scores.items():
        if code in SCORE_DIM_MAP:
            vec[SCORE_DIM_MAP[code]] += val
    total = sum(v for k, v in vec.items() if k != "혼잡선호")
    if total > 0:
        for dim in DIMS[:-1]:
            vec[dim] /= total
    return vec


# ── 비율 처리 ──────────────────────────────────

def resolve_ratio(survey, concept):
    """
    커스텀 비율이 있으면 그걸 쓰고, 없으면 컨셉 기본값 사용
    커스텀 비율 형식: {"맛집": 30, "관광지": 40, "자연": 0, "쇼핑": 30}
    합산이 100이 아니어도 자동 정규화
    """
    custom = survey.get("커스텀비율")

    if custom:
        total = sum(custom.values())
        if total == 0:
            return RATIO_MAP.get(concept, {"맛집": 25, "관광지": 25, "자연": 25, "쇼핑": 25})
        return {k: round(v / total * 100) for k, v in custom.items()}

    return RATIO_MAP.get(concept, {"맛집": 25, "관광지": 25, "자연": 25, "쇼핑": 25})


# ── 사용자 벡터 생성 ───────────────────────────

def build_user_vec(survey: dict) -> dict:
    """
    프론트엔드 설문 응답을 받아 벡터 + 메타 정보로 변환

    Parameters
    ----------
    survey : dict
        {
            "경기장":       "수원KT위즈파크",
            "여행_방식":    "경기 전",
            "이동방식":     "대중교통+도보",  # "자차+도보" / "도보 단독"
            "최대이동시간": "1시간",
            "동행":         "친구와 여행",
            "추가동행":     [],
            "컨셉":         "미식 탐방형",
            "추가조건":     ["혼잡 피하기"],
            "최대이동시간": "1시간",           # "30분"/"1시간"/"1시간 30분"/"2시간"/"3시간"
            "걷는거리":     "20분 이내",       # "10분 이내"/"20분 이내"/"30분 이내"/"상관없음"
            "고정핀":       ["경복궁"],        # 꼭 넣고 싶은 장소
            "제외장소":     ["롯데월드몰"],     # 피하고 싶은 장소
            "제외조건":     [],
            "커스텀비율":   {"맛집": 30, "관광지": 40, "자연": 0, "쇼핑": 30}  # 선택사항
        }
    """
    concept = survey.get("컨셉", "관광지 중심형")
    base    = CONCEPT_VEC.get(concept, CONCEPT_VEC["관광지 중심형"]).copy()
    vec     = {dim: base[i] for i, dim in enumerate(DIMS)}

    # 동행 보정
    companion = survey.get("동행", "")
    if companion in COMPANION_ADJUST:
        for dim, delta in COMPANION_ADJUST[companion].items():
            vec[dim] = vec.get(dim, 0) + delta

    # 추가 조건 보정
    for extra in survey.get("추가조건", []):
        if extra in EXTRA_ADJUST:
            for dim, delta in EXTRA_ADJUST[extra].items():
                vec[dim] = vec.get(dim, 0) + delta

    # 혼잡선호 클램핑
    vec["혼잡선호"] = max(-1.0, min(1.0, vec["혼잡선호"]))

    # 정규화 (혼잡선호 제외)
    main_dims = [d for d in DIMS if d != "혼잡선호"]
    total     = sum(abs(vec[d]) for d in main_dims)
    if total > 0:
        for dim in main_dims:
            vec[dim] /= total

    # 비율 결정 (커스텀 or 컨셉 기본값)
    ratio = resolve_ratio(survey, concept)

    meta = {
        "ratio":             ratio,
        "radius_km":         TRANSPORT_RADIUS.get(survey.get("이동방식", "대중교통+도보"), 5),
        "max_spots":         MAX_SPOT_COUNT.get(survey.get("최대이동시간", "1시간"), 3),
        "max_walk_minutes":  MAX_WALK_MINUTES.get(survey.get("걷는거리", "상관없음"), 999),
        "trip_timing":       survey.get("여행_방식", "경기 전"),
        "fixed_pins":        survey.get("고정핀", []),       # 꼭 넣고 싶은 장소
        "exclude_spots":     survey.get("제외장소", []),     # 피하고 싶은 장소
        "accessibility":     [
            ACCESSIBILITY_FILTER[a]
            for a in survey.get("추가동행", [])
            if a in ACCESSIBILITY_FILTER
        ],
        "exclude_categories": [
            cat
            for ex in survey.get("제외조건", [])
            for cat in EXCLUDE_CATEGORY_MAP.get(ex, [])
        ],
        "concept":      concept,
        "stadium_lat":  survey.get("stadium_lat"),   # 경기장 위도 (recommend.py에서 주입)
        "stadium_lng":  survey.get("stadium_lng"),   # 경기장 경도 (recommend.py에서 주입)
    }

    return {
        "vector": [vec[dim] for dim in DIMS],
        "meta":   meta,
    }


# ── 후보 필터링 ────────────────────────────────

def filter_candidates(user_result, spots, relations):
    """
    장소 후보를 점수 순으로 정렬해 반환
    점수 = 코사인유사도 + 우선카테고리보너스(0.15) + 순위보너스(최대0.05) - 혼잡도패널티

    제외 처리:
    - exclude_categories: 카테고리 단위 제외
    - exclude_spots:      장소명 단위 제외 (피하고 싶은 장소)
    """
    user_vec      = user_result["vector"]
    meta          = user_result["meta"]
    concept       = meta.get("concept", "관광지 중심형")
    exclude_cats      = meta["exclude_categories"]
    exclude_spots     = meta.get("exclude_spots", [])      # 피하고 싶은 장소
    max_walk_minutes  = meta.get("max_walk_minutes", 999)  # 걷는 거리 제한
    signgu_cd         = spots[0]["signgu_cd"] if spots else None

    # 연관 관광지에서 음식 장소 추가
    extra_spots = []
    if signgu_cd:
        seen = set(s["spot_name"] for s in spots)
        for r in relations:
            if r.get("related_mcls") != "음식":
                continue
            nm = r["related_nm"]
            if nm and nm not in seen:
                seen.add(nm)
                extra_spots.append({
                    "content_id": r["related_cd"],
                    "spot_name":  nm,
                    "area_cd":    spots[0]["area_cd"] if spots else "",
                    "signgu_cd":  signgu_cd,
                    "lcls_nm":    "관광지",
                    "mcls_nm":    "음식",
                    "map_x":      None,
                    "map_y":      None,
                    "hub_rank":   r.get("rlte_rank", "50"),
                    "vector":     build_spot_vec("기타관광"),
                })

    all_pool = spots + extra_spots

    # 카테고리 제외 + 장소명 제외 동시 처리
    all_pool = [
        s for s in all_pool
        if s["mcls_nm"] not in exclude_cats
        and s["spot_name"] not in exclude_spots
    ]

    # 걷는 거리 필터 (경기장 좌표 기준 haversine 거리 계산)
    # 도보 평균 속도 4km/h 기준
    stadium_lat = meta.get("stadium_lat")
    stadium_lng = meta.get("stadium_lng")

    if max_walk_minutes < 999 and stadium_lat and stadium_lng:
        import math
        max_dist_km = (max_walk_minutes / 60) * 4

        def haversine(lat1, lng1, lat2, lng2):
            R = 6371
            dlat = math.radians(lat2 - lat1)
            dlng = math.radians(lng2 - lng1)
            a = (math.sin(dlat/2)**2
                 + math.cos(math.radians(lat1))
                 * math.cos(math.radians(lat2))
                 * math.sin(dlng/2)**2)
            return R * 2 * math.asin(math.sqrt(a))

        def is_within_walk(spot):
            if not spot.get("map_x") or not spot.get("map_y"):
                return True  # 좌표 없으면 통과
            try:
                dist = haversine(
                    stadium_lat, stadium_lng,
                    float(spot["map_y"]), float(spot["map_x"])
                )
                return dist <= max_dist_km
            except Exception:
                return True

        all_pool = [s for s in all_pool if is_within_walk(s)]

    # 미식 탐방형이면 기타관광 제외
    if concept == "미식 탐방형":
        all_pool = [s for s in all_pool if s["mcls_nm"] != "기타관광"]

    scored = []
    for spot in all_pool:
        sim                = cosine_sim(user_vec[:-1], spot["vector"][:-1])
        priority_cats      = CONCEPT_CATEGORY_MAP.get(concept, [])
        priority_bonus     = 0.15 if spot["mcls_nm"] in priority_cats else 0.0
        congestion         = spot["vector"][-1]
        congestion_penalty = congestion * abs(min(user_vec[-1], 0))
        hub_rank           = int(spot.get("hub_rank") or 100)
        rank_bonus         = (100 - hub_rank) / 100 * 0.05
        score              = sim + priority_bonus + rank_bonus - congestion_penalty
        scored.append((score, spot))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [spot for _, spot in scored]


# ── 단일 코스 구성 ─────────────────────────────

def build_course(user_result, candidates, n=5):
    """
    맛집/관광지/자연/쇼핑 비율에 맞게 코스 구성
    고정핀(꼭 넣고 싶은 장소)은 반드시 포함
    """
    user_vec   = user_result["vector"]
    meta       = user_result["meta"]
    ratio      = meta["ratio"]
    fixed_pins = meta["fixed_pins"]
    max_spots  = meta["max_spots"]
    n          = min(n, max_spots)

    # 비율 → 장소 수 계산
    total    = sum(ratio.values())
    food_n   = round(n * ratio.get("맛집",   0) / total)
    tour_n   = round(n * ratio.get("관광지", 0) / total)
    nature_n = round(n * ratio.get("자연",   0) / total)
    shop_n   = n - food_n - tour_n - nature_n

    # 카테고리별 후보 분리
    food_pool   = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["맛집"]]
    tour_pool   = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["관광지"]]
    nature_pool = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["자연"]]
    shop_pool   = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["쇼핑"]]

    def pick_best(pool, course, k, exclude=set()):
        if k <= 0:
            return []
        scored = []
        for spot in pool:
            if spot["spot_name"] in exclude:
                continue
            temp     = course + [spot]
            temp_vec = np.mean([s["vector"][:-1] for s in temp], axis=0)
            sim      = cosine_sim(user_vec[:-1], temp_vec)
            cp       = spot["vector"][-1] * abs(min(user_vec[-1], 0))
            scored.append((sim - cp, spot))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s for _, s in scored[:k]]

    course = []

    # 고정핀 먼저 (꼭 넣고 싶은 장소)
    for pin_name in fixed_pins:
        for pool in [food_pool, tour_pool, nature_pool, shop_pool, candidates]:
            pin = next((s for s in pool if pin_name in s["spot_name"]), None)
            if pin:
                course.append(pin)
                for p in [food_pool, tour_pool, nature_pool, shop_pool]:
                    if pin in p:
                        p.remove(pin)
                break

    # 카테고리별 강제 배분
    food_picked = pick_best(food_pool, course, food_n)
    course.extend(food_picked)
    used = set(s["spot_name"] for s in course)

    tour_picked = pick_best([s for s in tour_pool if s["spot_name"] not in used], course, tour_n)
    course.extend(tour_picked)
    used.update(s["spot_name"] for s in tour_picked)

    nature_picked = pick_best([s for s in nature_pool if s["spot_name"] not in used], course, nature_n)
    course.extend(nature_picked)
    used.update(s["spot_name"] for s in nature_picked)

    shop_picked = pick_best([s for s in shop_pool if s["spot_name"] not in used], course, shop_n)
    course.extend(shop_picked)

    return course[:n]


# ── MMR 대안 코스 생성 ─────────────────────────

def spot_overlap(course1, course2):
    names1 = set(s["spot_name"] for s in course1)
    names2 = set(s["spot_name"] for s in course2)
    if not names1 or not names2:
        return 0.0
    return len(names1 & names2) / len(names1 | names2)


def mmr_courses(user_result, candidates, k=3, n=5):
    """서로 다른 대안 코스 k개 생성"""
    user_vec = user_result["vector"]
    meta     = user_result["meta"]
    ratio    = meta["ratio"]

    total    = sum(ratio.values())
    food_n   = round(n * ratio.get("맛집",   0) / total)
    tour_n   = round(n * ratio.get("관광지", 0) / total)
    nature_n = round(n * ratio.get("자연",   0) / total)
    shop_n   = n - food_n - tour_n - nature_n

    food_pool   = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["맛집"]]
    tour_pool   = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["관광지"]]
    nature_pool = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["자연"]]
    shop_pool   = [s for s in candidates if s["mcls_nm"] in RATIO_CATEGORY_MAP["쇼핑"]]

    def pick_best(pool, course, k, exclude=set()):
        if k <= 0:
            return []
        scored = []
        for spot in pool:
            if spot["spot_name"] in exclude:
                continue
            temp     = course + [spot]
            temp_vec = np.mean([s["vector"][:-1] for s in temp], axis=0)
            sim      = cosine_sim(user_vec[:-1], temp_vec)
            cp       = spot["vector"][-1] * abs(min(user_vec[-1], 0))
            scored.append((sim - cp, spot))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s for _, s in scored[:k]]

    courses         = []
    used_food_names = set()
    used_tour_names = set()
    used_nat_names  = set()

    for c_idx in range(k):
        course = []

        food_picked = pick_best(
            food_pool, course, food_n,
            exclude=used_food_names if c_idx > 0 else set()
        )
        if len(food_picked) < food_n:
            food_picked = pick_best(food_pool, course, food_n)
        course.extend(food_picked)
        used_food_names.update(s["spot_name"] for s in food_picked)

        tour_picked = pick_best(tour_pool, course, tour_n, exclude=used_tour_names)
        if len(tour_picked) < tour_n:
            tour_picked = pick_best(
                tour_pool, course, tour_n,
                exclude=set(s["spot_name"] for s in course)
            )
        course.extend(tour_picked)
        used_tour_names.update(s["spot_name"] for s in tour_picked)

        nat_picked = pick_best(nature_pool, course, nature_n, exclude=used_nat_names)
        if len(nat_picked) < nature_n:
            nat_picked = pick_best(
                nature_pool, course, nature_n,
                exclude=set(s["spot_name"] for s in course)
            )
        course.extend(nat_picked)
        used_nat_names.update(s["spot_name"] for s in nat_picked)

        used_now    = set(s["spot_name"] for s in course)
        shop_picked = pick_best(shop_pool, course, shop_n, exclude=used_now)
        if len(shop_picked) < shop_n:
            shop_picked = pick_best(shop_pool, course, shop_n)
        course.extend(shop_picked)

        courses.append(course[:n])

    return courses


# ── 코스 요약 텍스트 생성 ──────────────────────

def generate_summary(course, city, concept):
    """슬롯 템플릿 방식으로 코스 요약 텍스트 자동 생성 (LLM 미사용)"""
    food_cats = RATIO_CATEGORY_MAP["맛집"]
    tour_cats = RATIO_CATEGORY_MAP["관광지"]

    food_n   = sum(1 for s in course if s["mcls_nm"] in food_cats)
    tour_n   = sum(1 for s in course if s["mcls_nm"] in tour_cats)
    distance = round(len(course) * 1.2, 1)

    templates = SUMMARY_TEMPLATES.get(concept, SUMMARY_TEMPLATES["관광지 중심형"])
    template  = random.choice(templates)

    summary = template.format(
        city      = city,
        count     = len(course),
        spot1     = course[0]["spot_name"] if len(course) > 0 else "",
        spot2     = course[1]["spot_name"] if len(course) > 1 else "",
        spot_last = course[-1]["spot_name"] if course else "",
        food_n    = food_n,
        tour_n    = tour_n,
        distance  = distance,
    )

    tags = list(dict.fromkeys(
        CAT_LABEL.get(s["mcls_nm"], s["mcls_nm"]) for s in course
    ))

    return {
        "summary": summary,
        "tags":    tags,
        "stats": {
            "총 장소":   len(course),
            "맛집":     food_n,
            "관광":     tour_n,
            "거리(km)": distance,
        }
    }


# ── 피드백 반영 ────────────────────────────────

def apply_feedback(user_result, liked_spots=[], disliked_spots=[], lr=0.05):
    """
    좋아요/싫어요를 사용자 벡터에 즉각 반영 (세션 내 유효)

    Parameters
    ----------
    lr : float
        학습률. 너무 크면 벡터가 한쪽으로 쏠림 (기본값 0.05)
    """
    vec  = list(user_result["vector"])
    meta = user_result["meta"]

    for spot in liked_spots:
        for i in range(len(vec) - 1):
            vec[i] += lr * spot["vector"][i]

    for spot in disliked_spots:
        for i in range(len(vec) - 1):
            vec[i] -= lr * spot["vector"][i]

    vec[-1] = max(-1.0, min(1.0, vec[-1]))

    main_vals = normalize(vec[:-1])
    vec       = main_vals + [vec[-1]]

    return {
        "vector": vec,
        "meta":   meta,
    }