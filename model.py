# model.py
# 추천 모델 핵심 로직 (벡터 생성, 필터링, 코스 구성, MMR, 요약, 피드백)

import numpy as np
import random
from constants import (
    DIMS, CATEGORY_VEC, SCORE_DIM_MAP,
    CONCEPT_VEC, COMPANION_ADJUST, EXTRA_ADJUST,
    RATIO_MAP, TRANSPORT_RADIUS, MAX_SPOT_COUNT,
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


# ── 사용자 벡터 생성 ───────────────────────────

def build_user_vec(survey: dict) -> dict:
    """
    프론트엔드 설문 응답을 받아 벡터 + 메타 정보로 변환

    Parameters
    ----------
    survey : dict
        {
            "경기장":       "수원 KT위즈파크",
            "여행_방식":    "경기 전",
            "이동수단":     "대중교통",
            "최대이동시간": "1시간",
            "동행":         "친구와 여행",
            "추가동행":     [],
            "컨셉":         "미식 탐방형",
            "추가조건":     ["혼잡 피하기"],
            "고정핀":       [],
            "제외조건":     [],
        }

    Returns
    -------
    dict
        {
            "vector": [float, ...],  # 8차원 벡터
            "meta":   {...}          # 필터링/코스 구성 메타 정보
        }
    """
    concept = survey.get("컨셉", "관광지 중심형")
    base    = CONCEPT_VEC.get(concept, CONCEPT_VEC["관광지 중심형"]).copy()
    vec     = {dim: base[i] for i, dim in enumerate(DIMS)}

    companion = survey.get("동행", "")
    if companion in COMPANION_ADJUST:
        for dim, delta in COMPANION_ADJUST[companion].items():
            vec[dim] = vec.get(dim, 0) + delta

    for extra in survey.get("추가조건", []):
        if extra in EXTRA_ADJUST:
            for dim, delta in EXTRA_ADJUST[extra].items():
                vec[dim] = vec.get(dim, 0) + delta

    vec["혼잡선호"] = max(-1.0, min(1.0, vec["혼잡선호"]))

    main_dims = [d for d in DIMS if d != "혼잡선호"]
    total     = sum(abs(vec[d]) for d in main_dims)
    if total > 0:
        for dim in main_dims:
            vec[dim] /= total

    meta = {
        "ratio":             RATIO_MAP.get(concept, {"음식": 33, "관광": 34, "카페": 33}),
        "radius_km":         TRANSPORT_RADIUS.get(survey.get("이동수단", "대중교통"), 5),
        "max_spots":         MAX_SPOT_COUNT.get(survey.get("최대이동시간", "1시간"), 5),
        "trip_timing":       survey.get("여행_방식", "경기 전"),
        "fixed_pins":        survey.get("고정핀", []),
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
        "concept": concept,
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
    """
    user_vec     = user_result["vector"]
    meta         = user_result["meta"]
    concept      = meta.get("concept", "관광지 중심형")
    exclude_cats = meta["exclude_categories"]
    signgu_cd    = spots[0]["signgu_cd"] if spots else None

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
    all_pool = [s for s in all_pool if s["mcls_nm"] not in exclude_cats]

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
    컨셉 비율(음식/관광/카페)에 맞게 코스 구성
    고정 핀이 있으면 해당 장소를 먼저 포함
    """
    user_vec   = user_result["vector"]
    meta       = user_result["meta"]
    ratio      = meta["ratio"]
    fixed_pins = meta["fixed_pins"]
    max_spots  = meta["max_spots"]
    n          = min(n, max_spots)

    food_n = round(n * ratio["음식"]  / 100)
    tour_n = round(n * ratio["관광"]  / 100)
    cafe_n = n - food_n - tour_n

    food_cats = ["음식", "기타관광"]
    tour_cats = ["역사관광", "문화관광", "자연관광", "체험관광", "레저스포츠"]
    cafe_cats = ["쇼핑"]

    food_pool = [s for s in candidates if s["mcls_nm"] in food_cats]
    tour_pool = [s for s in candidates if s["mcls_nm"] in tour_cats]
    cafe_pool = [s for s in candidates if s["mcls_nm"] in cafe_cats]

    def pick_best(pool, course, k, exclude=set()):
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

    # 고정 핀 먼저
    for pin_name in fixed_pins:
        for pool in [food_pool, tour_pool, cafe_pool, candidates]:
            pin = next((s for s in pool if pin_name in s["spot_name"]), None)
            if pin:
                course.append(pin)
                for p in [food_pool, tour_pool, cafe_pool]:
                    if pin in p:
                        p.remove(pin)
                break

    food_picked = pick_best(food_pool, course, food_n)
    course.extend(food_picked)
    used = set(s["spot_name"] for s in food_picked)

    tour_picked = pick_best([s for s in tour_pool if s["spot_name"] not in used], course, tour_n)
    course.extend(tour_picked)
    used.update(s["spot_name"] for s in tour_picked)

    cafe_picked = pick_best([s for s in cafe_pool if s["spot_name"] not in used], course, cafe_n)
    course.extend(cafe_picked)

    return course[:n]


# ── MMR 대안 코스 생성 ─────────────────────────

def spot_overlap(course1, course2):
    names1 = set(s["spot_name"] for s in course1)
    names2 = set(s["spot_name"] for s in course2)
    if not names1 or not names2:
        return 0.0
    return len(names1 & names2) / len(names1 | names2)


def mmr_courses(user_result, candidates, k=3, n=5):
    """
    서로 다른 대안 코스 k개 생성
    코스마다 다른 음식점/관광지를 사용해 다양성 확보
    """
    user_vec = user_result["vector"]
    meta     = user_result["meta"]
    ratio    = meta["ratio"]

    food_n = round(n * ratio["음식"]  / 100)
    tour_n = round(n * ratio["관광"]  / 100)
    cafe_n = n - food_n - tour_n

    food_cats = ["음식", "기타관광"]
    tour_cats = ["역사관광", "문화관광", "자연관광", "체험관광", "레저스포츠"]
    cafe_cats = ["쇼핑"]

    food_pool = [s for s in candidates if s["mcls_nm"] in food_cats]
    tour_pool = [s for s in candidates if s["mcls_nm"] in tour_cats]
    cafe_pool = [s for s in candidates if s["mcls_nm"] in cafe_cats]

    def pick_best(pool, course, k, exclude=set()):
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
    used_tour_names = set()
    used_food_names = set()

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

        used_now    = set(s["spot_name"] for s in course)
        cafe_picked = pick_best(cafe_pool, course, cafe_n, exclude=used_now)
        if len(cafe_picked) < cafe_n:
            cafe_picked = pick_best(cafe_pool, course, cafe_n)
        course.extend(cafe_picked)

        courses.append(course[:n])

    return courses


# ── 코스 요약 텍스트 생성 ──────────────────────

def generate_summary(course, city, concept):
    """
    슬롯 템플릿 방식으로 코스 요약 텍스트 자동 생성 (LLM 미사용)
    """
    food_cats = ["음식", "기타관광"]
    tour_cats = ["역사관광", "문화관광", "자연관광", "체험관광", "레저스포츠"]

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
            "음식":     food_n,
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
