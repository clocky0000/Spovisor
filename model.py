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
    ARRIVE_BEFORE_MINUTES, STAY_MINUTES, TRANSPORT_SPEED, TRIP_DURATION_DAYS,
)
from datetime import datetime, timedelta



# ── 시간 유틸 ──────────────────────────────────

def parse_time(time_str):
    """'18:30' → datetime 객체"""
    try:
        return datetime.strptime(time_str, "%H:%M")
    except Exception:
        return None

def format_time(dt):
    """datetime → '18:30'"""
    return dt.strftime("%H:%M") if dt else None

def add_minutes(time_str, minutes):
    """'18:30' + 60분 → '19:30'"""
    dt = parse_time(time_str)
    if not dt:
        return None
    return format_time(dt + timedelta(minutes=minutes))

def sub_minutes(time_str, minutes):
    """'18:30' - 60분 → '17:30'"""
    dt = parse_time(time_str)
    if not dt:
        return None
    return format_time(dt - timedelta(minutes=minutes))

def calc_travel_minutes(lat1, lng1, lat2, lng2, transport):
    """두 좌표 간 이동 시간(분) 추정"""
    import math
    if not all([lat1, lng1, lat2, lng2]):
        return 10  # 좌표 없으면 기본 10분
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    dist_km = R * 2 * math.asin(math.sqrt(a))
    speed = TRANSPORT_SPEED.get(transport, 20)
    return max(5, int(dist_km / speed * 60))

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

    # 경기장 도착 마감 시간 계산
    game_time      = survey.get("경기시간", "")
    arrive_before  = survey.get("도착희망시간", "1시간 전")
    arrive_minutes = ARRIVE_BEFORE_MINUTES.get(arrive_before, 60)
    game_deadline  = sub_minutes(game_time, arrive_minutes) if game_time else None

    transport = survey.get("이동방식", "대중교통+도보")

    meta = {
        "ratio":              ratio,
        "radius_km":          TRANSPORT_RADIUS.get(transport, 5),
        "max_spots":          MAX_SPOT_COUNT.get(survey.get("최대이동시간", "1시간"), 3),
        "max_walk_minutes":   MAX_WALK_MINUTES.get(survey.get("걷는거리", "상관없음"), 999),
        "trip_timing":        survey.get("여행_방식", "경기 전"),
        "trip_duration":      survey.get("여행기간", "당일치기"),
        "trip_days":          TRIP_DURATION_DAYS.get(survey.get("여행기간", "당일치기"), 1),
        "fixed_pins":         survey.get("고정핀", []),
        "exclude_spots":      survey.get("제외장소", []),
        "accessibility":      [
            ACCESSIBILITY_FILTER[a]
            for a in survey.get("추가동행", [])
            if a in ACCESSIBILITY_FILTER
        ],
        "exclude_categories": [
            cat
            for ex in survey.get("제외조건", [])
            for cat in EXCLUDE_CATEGORY_MAP.get(ex, [])
        ],
        "concept":            concept,
        "transport":          transport,
        "stadium_lat":        survey.get("stadium_lat"),
        "stadium_lng":        survey.get("stadium_lng"),
        "origin_lat":         survey.get("origin_lat"),
        "origin_lng":         survey.get("origin_lng"),
        "selected_api_name":  survey.get("selected_api_name", ""),
        "game_time":          game_time,
        "game_deadline":      game_deadline,
        "depart_time":        survey.get("출발희망시간", "09:00"),
        "consecutive_games":  survey.get("추가관람경기_일정", []),
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
    user_vec         = user_result["vector"]
    meta             = user_result["meta"]
    concept          = meta.get("concept", "관광지 중심형")
    exclude_cats     = meta["exclude_categories"]
    exclude_spots    = meta.get("exclude_spots", [])
    max_walk_minutes = meta.get("max_walk_minutes", 999)
    selected_api_name = meta.get("selected_api_name", "")  # 선택한 경기장 API명
    signgu_cd        = spots[0]["signgu_cd"] if spots else None

    # 다른 경기장 제외할 키워드
    STADIUM_KW = ["야구장","축구장","경기장","체육관","아레나","돔","스타디움","볼파크","스틸야드","운동장","풋살"]

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
                    "map_x":      r.get("map_x"),   # recommend.py에서 주입한 좌표
                    "map_y":      r.get("map_y"),
                    "hub_rank":   r.get("rlte_rank", "50"),
                    "vector":     build_spot_vec("기타관광"),
                })

    all_pool = spots + extra_spots

    # 카테고리 제외 + 장소명 제외
    all_pool = [
        s for s in all_pool
        if s["mcls_nm"] not in exclude_cats
        and s["spot_name"] not in exclude_spots
    ]

    # 좌표 없는 장소 제외 (경기장 강제추가 장소는 예외)
    all_pool = [
        s for s in all_pool
        if (s.get("map_x") and s.get("map_y"))
        or s.get("content_id", "").startswith("stadium_")
        or s.get("content_id", "").startswith("pin_")
    ]

    # 선택한 경기장 외 다른 스포츠 시설 제외
    all_pool = [
        s for s in all_pool
        if not any(kw in s["spot_name"] for kw in STADIUM_KW)
        or s["spot_name"] == selected_api_name
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

    # 방법 2: 매 요청마다 다른 랜덤 시드
    random.seed()

    # 방법 1: 점수 차이 0.05 이내는 동등 그룹으로 셔플
    if scored:
        top_score = scored[0][0]
        top_group = [s for score, s in scored if top_score - score <= 0.05]
        rest      = [s for score, s in scored if top_score - score > 0.05]
        random.shuffle(top_group)
        scored_spots = top_group + rest
    else:
        scored_spots = [spot for _, spot in scored]

    # 같은 브랜드명 1개만 허용 (슬래시 앞 브랜드명 기준)
    def get_brand(name):
        return name.split("/")[0].strip()

    seen_brands = set()
    result      = []
    for spot in scored_spots:
        brand = get_brand(spot["spot_name"])
        if brand in seen_brands:
            continue
        seen_brands.add(brand)
        result.append(spot)

    return result


# ── 단일 코스 구성 ─────────────────────────────

def build_course(user_result, candidates, n=5):
    """
    맛집/관광지/자연/쇼핑 비율에 맞게 코스 구성
    고정핀(꼭 넣고 싶은 장소)은 반드시 포함
    같은 카테고리 연속 방지
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

    def interleave_categories(spots):
        """음식 연속 최대 1개 강제: 음식-비음식 교대 배치"""
        from collections import defaultdict
        groups = defaultdict(list)
        for s in spots:
            if s["mcls_nm"] in RATIO_CATEGORY_MAP["맛집"]:
                groups["음식"].append(s)
            else:
                groups["관광"].append(s)  # 관광+쇼핑+자연 모두 비음식 그룹

        result = []
        food_q = groups["음식"]
        tour_q = groups["관광"]
        fi, ti = 0, 0

        # 음식 연속 최대 1개 강제
        # 관광지 부족하면 쇼핑/자연도 관광 그룹에 포함됐으므로 그대로 교대
        while fi < len(food_q) or ti < len(tour_q):
            last_cat     = result[-1]["mcls_nm"] if result else None
            last_is_food = last_cat in RATIO_CATEGORY_MAP["맛집"] if last_cat else False

            if not last_is_food and fi < len(food_q):
                # 직전이 음식 아니면 음식 배치
                result.append(food_q[fi]); fi += 1
            elif ti < len(tour_q):
                # 관광 배치
                result.append(tour_q[ti]); ti += 1
            elif fi < len(food_q):
                # 관광 다 소진되면 음식 나머지 배치
                result.append(food_q[fi]); fi += 1

        return result

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
    used = set(s["spot_name"] for s in course)
    used.update(s["spot_name"] for s in food_picked)

    tour_picked = pick_best([s for s in tour_pool if s["spot_name"] not in used], course, tour_n)
    used.update(s["spot_name"] for s in tour_picked)

    nature_picked = pick_best([s for s in nature_pool if s["spot_name"] not in used], course, nature_n)
    used.update(s["spot_name"] for s in nature_picked)

    shop_picked = pick_best([s for s in shop_pool if s["spot_name"] not in used], course, shop_n)

    # 고정핀 제외한 나머지 카테고리 교대 배치
    rest = food_picked + tour_picked + nature_picked + shop_picked
    rest = interleave_categories(rest)

    course = course + rest

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
    user_vec   = user_result["vector"]
    meta       = user_result["meta"]
    ratio      = meta["ratio"]
    fixed_pins = meta["fixed_pins"]

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

    trip_timing       = meta.get("trip_timing", "경기 전")
    selected_api_name = meta.get("selected_api_name", "")

    STADIUM_KW = ["야구장","축구장","경기장","체육관","아레나","돔","스타디움","볼파크","스틸야드"]

    def is_stadium(spot):
        return (spot.get("content_id", "").startswith("stadium_") or
                any(kw in spot["spot_name"] for kw in STADIUM_KW))

    def add_fixed_pins(course, f_pool, t_pool, nat_pool, s_pool):
        """일반 고정핀만 먼저 추가 (경기장은 나중에 위치 조정)"""
        for pin_name in fixed_pins:
            for pool in [f_pool, t_pool, nat_pool, s_pool, candidates]:
                pin = next((s for s in pool if pin_name in s["spot_name"]), None)
                if pin and pin not in course and not is_stadium(pin):
                    course.append(pin)
                    for p in [f_pool, t_pool, nat_pool, s_pool]:
                        if pin in p:
                            p.remove(pin)
                    break
        return course

    def get_stadium_pin():
        """고정핀 중 경기장 찾기 (selected_api_name 우선)"""
        # selected_api_name으로 직접 찾기
        if selected_api_name:
            pin = next((s for s in candidates if s["spot_name"] == selected_api_name), None)
            if pin:
                print(f"    [디버그] 경기장 핀 찾음: {pin['spot_name']}")
                return pin
        # 고정핀에서 경기장 키워드 포함 장소 찾기
        for pin_name in fixed_pins:
            pin = next((s for s in candidates if pin_name in s["spot_name"]), None)
            if pin and is_stadium(pin):
                print(f"    [디버그] 경기장 핀 찾음(키워드): {pin['spot_name']}")
                return pin
        print(f"    [디버그] 경기장 핀 못 찾음 (selected_api_name={selected_api_name}, fixed_pins={fixed_pins})")
        return None

    def insert_stadium(course, stadium_spot):
        """trip_timing에 따라 경기장을 적절한 위치에 삽입"""
        course = [s for s in course if s["spot_name"] != stadium_spot["spot_name"]]
        if trip_timing == "경기 전":
            return course + [stadium_spot]
        elif trip_timing == "경기 후":
            return [stadium_spot] + course
        else:  # 전후 모두
            mid = len(course) // 2
            return course[:mid] + [stadium_spot] + course[mid:]

    courses         = []
    used_food_names = set()
    used_tour_names = set()
    used_nat_names  = set()
    used_shop_names = set()

    for c_idx in range(k):
        # 각 코스마다 풀 복사 (고정핀 제거 반영을 위해)
        f_pool   = list(food_pool)
        t_pool   = list(tour_pool)
        nat_pool = list(nature_pool)
        s_pool   = list(shop_pool)

        course = []

        # 고정핀 먼저 추가
        course = add_fixed_pins(course, f_pool, t_pool, nat_pool, s_pool)

        # 고정핀 카테고리 차감
        pin_names    = {s["spot_name"] for s in course}
        cur_food_n   = food_n   - sum(1 for s in course if s["mcls_nm"] in RATIO_CATEGORY_MAP["맛집"])
        cur_tour_n   = tour_n   - sum(1 for s in course if s["mcls_nm"] in RATIO_CATEGORY_MAP["관광지"])
        cur_nature_n = nature_n - sum(1 for s in course if s["mcls_nm"] in RATIO_CATEGORY_MAP["자연"])
        cur_shop_n   = shop_n   - sum(1 for s in course if s["mcls_nm"] in RATIO_CATEGORY_MAP["쇼핑"])

        # 카테고리별 장소 선택
        food_picked = pick_best(
            f_pool, course, cur_food_n,
            exclude=used_food_names | pin_names if c_idx > 0 else pin_names
        )
        if len(food_picked) < cur_food_n:
            food_picked = pick_best(f_pool, course, cur_food_n, exclude=pin_names)
        used_food_names.update(s["spot_name"] for s in food_picked)

        used_now    = pin_names | {s["spot_name"] for s in food_picked}
        tour_picked = pick_best(t_pool, course, cur_tour_n, exclude=used_tour_names | used_now)
        if len(tour_picked) < cur_tour_n:
            tour_picked = pick_best(t_pool, course, cur_tour_n, exclude=used_now)
        used_tour_names.update(s["spot_name"] for s in tour_picked)

        used_now   = used_now | {s["spot_name"] for s in tour_picked}
        nat_picked = pick_best(nat_pool, course, cur_nature_n, exclude=used_nat_names | used_now)
        if len(nat_picked) < cur_nature_n:
            nat_picked = pick_best(nat_pool, course, cur_nature_n, exclude=used_now)
        used_nat_names.update(s["spot_name"] for s in nat_picked)

        used_now    = used_now | {s["spot_name"] for s in nat_picked}
        shop_picked = pick_best(s_pool, course, cur_shop_n, exclude=used_shop_names | used_now)
        if len(shop_picked) < cur_shop_n:
            shop_picked = pick_best(s_pool, course, cur_shop_n, exclude=used_now)
        used_shop_names.update(s["spot_name"] for s in shop_picked)

        # 음식-비음식 교대 배치 (음식 연속 최대 1개)
        from collections import defaultdict
        pin_spots = list(course)  # 고정핀만
        rest      = food_picked + tour_picked + nat_picked + shop_picked

        groups = defaultdict(list)
        for s in rest:
            if s["mcls_nm"] in RATIO_CATEGORY_MAP["맛집"]:
                groups["음식"].append(s)
            else:
                groups["관광"].append(s)

        interleaved = []
        food_q = groups["음식"]
        tour_q = groups["관광"]
        fi, ti = 0, 0
        # 음식-관광 교대: 음식 먼저 시작, 연속 방지
        while fi < len(food_q) or ti < len(tour_q):
            last_cat = interleaved[-1]["mcls_nm"] if interleaved else None
            last_is_food = last_cat in RATIO_CATEGORY_MAP["맛집"] if last_cat else False

            if not last_is_food and fi < len(food_q):
                interleaved.append(food_q[fi]); fi += 1
            elif ti < len(tour_q):
                interleaved.append(tour_q[ti]); ti += 1
            elif fi < len(food_q):
                interleaved.append(food_q[fi]); fi += 1

        course = pin_spots + interleaved

        # 중복 장소 제거
        seen   = set()
        course = [s for s in course if not (s["spot_name"] in seen or seen.add(s["spot_name"]))]

        # 경기장 위치 조정 (자르기 전에 먼저 삽입)
        stadium_pin = get_stadium_pin()
        if stadium_pin:
            # 경기장 제외하고 n-1개로 자른 뒤 경기장 삽입
            course_no_stadium = [s for s in course if s["spot_name"] != stadium_pin["spot_name"]]
            course = insert_stadium(course_no_stadium[:n-1], stadium_pin)
        else:
            course = course[:n]

        courses.append(course)

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


# ── 시간 배정 ──────────────────────────────────

def assign_times(course, start_time, transport, game_deadline=None, game_spot_name=None):
    """
    코스 장소들에 도착/출발 시간 배정
    경기 전 코스: 경기장 도착 마감 시간 초과 장소 자동 제거
    """
    current = parse_time(start_time) if start_time else parse_time("09:00")
    if not current:
        current = parse_time("09:00")

    deadline_dt = parse_time(game_deadline) if game_deadline else None

    # 경기 전 코스: 경기장 이전 장소들이 마감 안에 들어오도록 필터링
    if deadline_dt and game_spot_name:
        stadium_idx = next(
            (i for i, s in enumerate(course) if s["spot_name"] == game_spot_name), None
        )
        if stadium_idx is not None:
            # 경기장 이전 장소들 시간 시뮬레이션
            valid_before = []
            sim_time = current
            for i in range(stadium_idx):
                spot = course[i]
                if i > 0:
                    prev = valid_before[-1] if valid_before else course[0]
                    travel = calc_travel_minutes(
                        float(prev["map_y"]) if prev.get("map_y") else None,
                        float(prev["map_x"]) if prev.get("map_x") else None,
                        float(spot["map_y"]) if spot.get("map_y") else None,
                        float(spot["map_x"]) if spot.get("map_x") else None,
                        transport
                    )
                    sim_time = sim_time + timedelta(minutes=travel)
                stay = STAY_MINUTES.get(spot["mcls_nm"], 60)
                end_time = sim_time + timedelta(minutes=stay)
                # 이 장소가 끝나는 시간이 마감을 넘으면 제외
                if end_time <= deadline_dt:
                    valid_before.append(spot)
                    sim_time = end_time
                else:
                    print(f"  [시간 초과] '{spot['spot_name']}' 제외 (끝나는 시간: {format_time(end_time)}, 마감: {game_deadline})")
            # 경기장 이후 장소들
            after_stadium = course[stadium_idx+1:]
            course = valid_before + [course[stadium_idx]] + after_stadium

    # 시간 배정
    result = []
    for i, spot in enumerate(course):
        if i > 0:
            prev = result[i-1]
            travel = calc_travel_minutes(
                float(prev["map_y"]) if prev.get("map_y") else None,
                float(prev["map_x"]) if prev.get("map_x") else None,
                float(spot["map_y"]) if spot.get("map_y") else None,
                float(spot["map_x"]) if spot.get("map_x") else None,
                transport
            )
            current = current + timedelta(minutes=travel)

        # 경기장 도착 마감 강제 조정
        if deadline_dt and spot["spot_name"] == game_spot_name:
            if current > deadline_dt:
                current = deadline_dt

        stay      = STAY_MINUTES.get(spot["mcls_nm"], 60)
        arrival   = format_time(current)
        departure = format_time(current + timedelta(minutes=stay))
        current   = current + timedelta(minutes=stay)

        result.append({
            **spot,
            "arrival_time":   arrival,
            "departure_time": departure,
            "stay_minutes":   stay,
        })

    return result


# ── 날짜별 코스 생성 ───────────────────────────

def build_daily_courses(user_result, candidates, game_spot_name):
    """
    여행기간에 따라 날짜별 코스 생성
    경기 있는 날: 경기장 포함 + 시간 제한
    경기 없는 날: 일반 코스
    """
    meta          = user_result["meta"]
    trip_days     = meta["trip_days"]
    trip_timing   = meta["trip_timing"]
    transport     = meta["transport"]
    depart_time   = meta["depart_time"]
    game_time     = meta["game_time"]
    game_deadline = meta["game_deadline"]
    consecutive   = meta["consecutive_games"]  # ["2026-06-30 14:00", ...]

    # 날짜별 경기 시간 파싱
    # day 1 = 메인 경기, 이후 consecutive_games
    game_by_day = {}
    game_by_day[1] = {"time": game_time, "deadline": game_deadline}

    for i, g in enumerate(consecutive):
        parts = g.split(" ")
        if len(parts) == 2:
            g_time     = parts[1]
            g_deadline = sub_minutes(g_time, 60)  # 기본 1시간 전
            game_by_day[i + 2] = {"time": g_time, "deadline": g_deadline}

    daily_courses = []

    for day in range(1, trip_days + 1):
        has_game   = day in game_by_day
        day_game   = game_by_day.get(day, {})
        day_timing = trip_timing if day == 1 else ("경기 전" if has_game else "없음")

        # 하루 코스 생성
        # 경기 없는 날은 max_spots 그대로, 경기 있는 날은 경기장 포함
        day_user_result = {
            "vector": user_result["vector"],
            "meta": {
                **meta,
                "trip_timing":   day_timing,
                "game_deadline": day_game.get("deadline") if has_game else None,
                "fixed_pins":    meta["fixed_pins"] if has_game else [
                    p for p in meta["fixed_pins"]
                    if p != game_spot_name
                ],
            }
        }

        course = build_course(day_user_result, candidates, n=meta["max_spots"])

        # 시간 배정
        course_with_time = assign_times(
            course,
            start_time   = depart_time,
            transport    = transport,
            game_deadline= day_game.get("deadline") if has_game else None,
            game_spot_name = game_spot_name if has_game else None,
        )

        daily_courses.append({
            "day":      day,
            "has_game": has_game,
            "game_time": day_game.get("time") if has_game else None,
            "arrive_by": day_game.get("deadline") if has_game else None,
            "spots":    course_with_time,
        })

    return daily_courses


def build_multi_day_courses(user_result, candidates, game_spot_name, k=3):
    """
    대안 코스 k개 × 날짜별 코스 생성
    """
    alt_courses = []

    # MMR로 음식점 다양하게 (mmr_courses 활용)
    base_courses = mmr_courses(user_result, candidates, k=k)

    for i, _ in enumerate(base_courses):
        # 각 대안 코스마다 후보 셔플해서 날짜별 코스 생성
        import random
        shuffled = list(candidates)
        random.shuffle(shuffled[:max(1, len(shuffled)//3)])  # 상위 1/3만 셔플

        daily = build_daily_courses(user_result, shuffled, game_spot_name)
        alt_courses.append(daily)

    return alt_courses