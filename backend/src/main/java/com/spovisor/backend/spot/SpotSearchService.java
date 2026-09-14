package com.spovisor.backend.spot;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.Normalizer;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class SpotSearchService {
    private static final Logger log = LoggerFactory.getLogger(SpotSearchService.class);
    private static final long IMAGE_REQUEST_INTERVAL_MILLIS = 250L;
    private static final long IMAGE_CACHE_TTL_MILLIS = 6L * 60L * 60L * 1_000L;
    private static final long TOUR_SESSION_CACHE_TTL_MILLIS = 30L * 60L * 1_000L;
    private static final String NAVER_IMAGE_CACHE_VERSION = "v4-place-relevance";
    private static final int MAX_BATCH_SPOTS = 100;
    private static final int NAVER_IMAGE_CANDIDATE_COUNT = 20;
    private static final int FACE_FILTER_CANDIDATE_COUNT = 12;
    private static final int TOUR_LOCATION_PAGE_SIZE = 1_000;
    private static final double TOUR_CLUSTER_DISTANCE_METERS = 15_000d;
    private static final double TOUR_MAX_RADIUS_METERS = 20_000d;
    private static final double TOUR_RADIUS_MARGIN_METERS = 1_500d;
    private static final double TOUR_EXACT_NAME_MAX_DISTANCE_METERS = 3_000d;
    private static final double TOUR_PARTIAL_NAME_MAX_DISTANCE_METERS = 1_000d;
    private static final Set<String> BLOCKED_NAVER_TITLE_TERMS = Set.of(
            "뉴스", "기사", "신문", "기자", "보도", "보도자료", "보도 사진", "카드뉴스",
            "홍보물", "홍보 포스터", "포스터", "전단", "리플렛", "브로슈어",
            "공지", "안내도", "지도 자료", "배너", "광고", "분양", "상업시설",
            "행사", "이벤트", "팝업", "캠페인", "챌린지",
            "채용", "모집 공고", "공모전", "논란", "사고", "전시회", "호텔 목록",
            "시설안내", "조직구성", "인사말", "오시는길", "아이디 찾기", "로그인",
            "배치도", "평면도", "도면", "약도", "위치도", "노선도", "시간표",
            "전자책", "교재", "기본서", "국회도서관", "정보검색",
            "강의", "수업", "세미나", "워크숍", "교육과정", "정기강좌", "수강생 모집", "수료식", "개강",
            "사진보도", "시정홍보관", "현판식", "업무협약"
    );
    private static final Set<String> BLOCKED_NAVER_HOST_PARTS = Set.of(
            "news.", "yna.co.kr", "newsis.com", "news1.kr", "chosun.com",
            "joongang.co.kr", "donga.com", "hani.co.kr", "khan.co.kr",
            "mk.co.kr", "sedaily.com", "edaily.co.kr", "heraldcorp.com",
            "nocutnews.co.kr", "ohmynews.com", "ytn.co.kr", "sbs.co.kr",
            "kbs.co.kr", "imbc.com", "jtbc.co.kr", "etnews.com", "zdnet.co.kr",
            "imgnews.naver.net", "ruliweb.com", "namu.wiki", "dbscthumb-phinf.pstatic.net",
            "image.aladin.co.kr", "dl.nanet.go.kr", "play-lh.googleusercontent.com",
            "yt3.googleusercontent.com", "clogo.saramin.co.kr"
    );
    private static final Set<String> NON_PHOTO_TITLE_TERMS = Set.of(
            "google play", "youtube", "유튜브", "로고", "아이콘", "앱 다운로드",
            "썸네일", "프로필", "스톡 이미지", "일러스트", "클립아트"
    );
    private static final Set<String> LODGING_TITLE_TERMS = Set.of(
            "호텔", "모텔", "숙소", "객실", "펜션", "리조트", "게스트하우스", "숙박 예약"
    );
    private static final Set<String> FOOD_TITLE_TERMS = Set.of(
            "맛집", "먹거리", "메뉴", "뷔페", "레스토랑", "식당", "카페", "치킨", "피자", "만두"
    );

    private final RestClient naverRestClient;
    private final RestClient tourRestClient;
    private final RestClient aiRestClient;
    private final String clientId;
    private final String clientSecret;
    private final String tourApiServiceKey;
    private final boolean allowNaverImageFallback;
    private final Object imageRequestLock = new Object();
    private final Map<String, CachedImages> imageCache = new ConcurrentHashMap<>();
    private final Map<String, TourSessionCache> tourismSessionCaches = new ConcurrentHashMap<>();
    private final ExecutorService tourImageExecutor = Executors.newFixedThreadPool(4, runnable -> {
        Thread thread = new Thread(runnable, "tour-api-image");
        thread.setDaemon(true);
        return thread;
    });
    private long lastImageRequestAt;

    public SpotSearchService(
            RestClient.Builder restClientBuilder,
            @Value("${app.naver.local.client-id:}") String clientId,
            @Value("${app.naver.local.client-secret:}") String clientSecret,
            @Value("${app.tour-api.service-key:}") String tourApiServiceKey,
            @Value("${app.images.allow-naver-fallback:false}") boolean allowNaverImageFallback,
            @Value("${ai.server.url:http://localhost:5000}") String aiServerUrl
    ) {
        this.naverRestClient = restClientBuilder.clone()
                .baseUrl("https://openapi.naver.com")
                .build();

        SimpleClientHttpRequestFactory tourRequestFactory = new SimpleClientHttpRequestFactory();
        tourRequestFactory.setConnectTimeout(Duration.ofSeconds(4));
        tourRequestFactory.setReadTimeout(Duration.ofSeconds(7));
        this.tourRestClient = restClientBuilder.clone()
                .baseUrl("https://apis.data.go.kr/B551011/KorService2")
                .requestFactory(tourRequestFactory)
                .build();

        SimpleClientHttpRequestFactory aiRequestFactory = new SimpleClientHttpRequestFactory();
        aiRequestFactory.setConnectTimeout(Duration.ofSeconds(3));
        aiRequestFactory.setReadTimeout(Duration.ofSeconds(30));
        this.aiRestClient = restClientBuilder.clone()
                .baseUrl(aiServerUrl.replaceAll("/+$", ""))
                .requestFactory(aiRequestFactory)
                .build();

        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tourApiServiceKey = tourApiServiceKey;
        this.allowNaverImageFallback = allowNaverImageFallback;
    }

    public List<SpotSearchResponse> search(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2) {
            throw new IllegalArgumentException("장소명은 두 글자 이상 입력해주세요.");
        }
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalStateException("네이버 검색 API 인증 정보가 설정되지 않았습니다.");
        }

        String uri = UriComponentsBuilder.fromPath("/v1/search/local.json")
                .queryParam("query", normalized)
                .queryParam("display", 5)
                .queryParam("start", 1)
                .queryParam("sort", "random")
                .build()
                .toUriString();
        JsonNode root = naverRestClient.get()
                .uri(uri)
                .header("X-Naver-Client-Id", clientId)
                .header("X-Naver-Client-Secret", clientSecret)
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .body(JsonNode.class);

        List<SpotSearchResponse> results = new ArrayList<>();
        if (root == null || !root.has("items")) return results;
        for (JsonNode item : root.get("items")) {
            String name = clean(item.path("title").asText());
            String address = item.path("address").asText(null);
            String roadAddress = item.path("roadAddress").asText(null);
            Double longitude = naverCoordinate(item.path("mapx").asText(null), true);
            Double latitude = naverCoordinate(item.path("mapy").asText(null), false);
            if (name.isBlank() || longitude == null || latitude == null) continue;
            String providerId = item.path("link").asText("");
            String contentId = "naver-" + Integer.toUnsignedString(
                    (name + "|" + roadAddress + "|" + longitude + "|" + latitude).hashCode()
            );
            results.add(new SpotSearchResponse(contentId, name, clean(item.path("category").asText()), null, null,
                    longitude, latitude, address, roadAddress, providerId));
        }
        return results;
    }

    /**
     * 한국관광공사 결과는 코스 생성 세션 안에서만 최대 30분 재사용한다.
     * 세션이 없거나 만료·삭제된 뒤에는 관광공사 API를 다시 실시간 호출한다.
     * 관광공사에 이미지가 없는 장소만 기존 네이버 6시간 캐시를 사용한다.
     */
    public List<SpotImageBatchResponse> searchImages(SpotImageBatchRequest request) {
        List<SpotImageQuery> spots = request == null || request.spots() == null
                ? List.of()
                : request.spots();
        if (spots.isEmpty()) return List.of();
        if (spots.size() > MAX_BATCH_SPOTS) {
            throw new IllegalArgumentException("이미지는 한 번에 최대 " + MAX_BATCH_SPOTS + "개 장소까지 조회할 수 있습니다.");
        }
        for (SpotImageQuery spot : spots) {
            if (spot == null || spot.name() == null || spot.name().trim().length() < 2) {
                throw new IllegalArgumentException("모든 장소에는 두 글자 이상의 장소명이 필요합니다.");
            }
        }

        TourSessionCache sessionCache = tourSessionCache(request == null ? null : request.cacheSessionId());
        Map<Long, TourismImageLookup> tourismLookups = new LinkedHashMap<>();
        List<SpotImageQuery> uncachedSpots = new ArrayList<>();
        for (SpotImageQuery spot : spots) {
            TourismImageLookup cached = sessionCache == null ? null : sessionCache.spots().get(spotCacheKey(spot));
            if (cached == null) uncachedSpots.add(spot);
            else tourismLookups.put(spot.id(), cached);
        }

        if (!uncachedSpots.isEmpty()) {
            TourismBatchLookup batchLookup = findTourismMatches(uncachedSpots);
            Map<String, CompletableFuture<List<SpotImageResponse>>> imageFutures = new LinkedHashMap<>();
            batchLookup.matches().values().forEach(place -> imageFutures.computeIfAbsent(
                    place.contentId(),
                    ignored -> CompletableFuture.supplyAsync(() -> searchTourismImages(place), tourImageExecutor)
            ));

            for (SpotImageQuery spot : uncachedSpots) {
                TourismPlace match = batchLookup.matches().get(spot.id());
                List<SpotImageResponse> images = List.of();
                if (match != null) {
                    try {
                        images = imageFutures.get(match.contentId()).join();
                    } catch (RuntimeException ignored) {
                        images = List.of();
                    }
                }
                String regionHint = batchLookup.regionHints().getOrDefault(spot.id(), "");
                if (images.isEmpty()) {
                    regionHint = resolveNaverRegionHint(spot, regionHint);
                }
                TourismImageLookup lookup = new TourismImageLookup(
                        images,
                        regionHint
                );
                tourismLookups.put(spot.id(), lookup);
                if (sessionCache != null) sessionCache.spots().put(spotCacheKey(spot), lookup);
            }
        }

        List<SpotImageBatchResponse> results = new ArrayList<>();
        for (SpotImageQuery spot : spots) {
            TourismImageLookup lookup = tourismLookups.getOrDefault(spot.id(), TourismImageLookup.empty());
            if (!lookup.images().isEmpty()) {
                results.add(new SpotImageBatchResponse(spot.id(), "TOUR_API", lookup.images()));
                continue;
            }

            if (!allowNaverImageFallback) {
                results.add(new SpotImageBatchResponse(spot.id(), "NONE", List.of()));
                continue;
            }
            List<SpotImageResponse> naverImages = searchNaverImages(
                    spot.name(),
                    lookup.regionHint(),
                    spot.category()
            );
            results.add(new SpotImageBatchResponse(
                    spot.id(),
                    naverImages.isEmpty() ? "NONE" : "NAVER",
                    naverImages
            ));
        }
        return List.copyOf(results);
    }

    public void clearTourismImageCache(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) return;
        tourismSessionCaches.remove(sessionId.trim());
    }

    public List<SpotImageResponse> searchImages(String query) {
        if (!allowNaverImageFallback) return List.of();
        return searchNaverImages(query, "", "");
    }

    private List<SpotImageResponse> searchNaverImages(String query, String regionHint, String category) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2) {
            throw new IllegalArgumentException("장소명은 두 글자 이상 입력해주세요.");
        }
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalStateException("네이버 검색 API 인증 정보가 설정되지 않았습니다.");
        }
        if (isClearlyNonPhysicalSpot(normalized)) return List.of();

        String searchQuery = buildNaverImageQuery(normalized, regionHint, category);
        String cacheKey = NAVER_IMAGE_CACHE_VERSION + "|" + normalizeName(searchQuery);

        long now = System.currentTimeMillis();
        CachedImages cached = imageCache.get(cacheKey);
        if (cached != null && cached.expiresAt() > now) {
            return cached.images();
        }
        if (cached != null) imageCache.remove(cacheKey, cached);

        String uri = UriComponentsBuilder.fromPath("/v1/search/image")
                .queryParam("query", searchQuery)
                .queryParam("display", NAVER_IMAGE_CANDIDATE_COUNT)
                .queryParam("start", 1)
                .queryParam("sort", "sim")
                .build()
                .toUriString();
        JsonNode root = requestNaverImagesWithRateLimit(uri);

        List<SpotImageResponse> results = new ArrayList<>();
        if (root == null || !root.has("items")) {
            List<SpotImageResponse> emptyResults = List.of();
            imageCache.put(cacheKey, new CachedImages(
                    emptyResults,
                    System.currentTimeMillis() + IMAGE_CACHE_TTL_MILLIS
            ));
            return emptyResults;
        }
        Set<String> seenImages = new LinkedHashSet<>();
        List<NaverImageCandidate> candidates = new ArrayList<>();
        int resultOrder = 0;
        for (JsonNode item : root.get("items")) {
            String imageUrl = item.path("link").asText("");
            String thumbnailUrl = item.path("thumbnail").asText("");
            String title = clean(item.path("title").asText(""));
            if (imageUrl.isBlank() && thumbnailUrl.isBlank()) continue;
            int width = item.path("sizewidth").asInt(0);
            int height = item.path("sizeheight").asInt(0);
            if (isBlockedNaverImage(normalized, title, imageUrl, width, height, category)) continue;
            String identity = imageUrl.isBlank() ? thumbnailUrl : imageUrl;
            if (!seenImages.add(identity)) continue;
            candidates.add(new NaverImageCandidate(
                    imageUrl,
                    thumbnailUrl,
                    title,
                    naverImageScore(normalized, title, imageUrl, resultOrder),
                    resultOrder
            ));
            resultOrder++;
        }
        candidates.sort(Comparator
                .comparingInt(NaverImageCandidate::score).reversed()
                .thenComparingInt(NaverImageCandidate::order));
        int minimumScore = candidates.isEmpty() ? Integer.MIN_VALUE : candidates.get(0).score() - 30;
        for (NaverImageCandidate candidate : candidates) {
            if (candidate.score() < minimumScore) break;
            results.add(new SpotImageResponse(
                    candidate.imageUrl(),
                    candidate.thumbnailUrl(),
                    candidate.title()
            ));
            if (results.size() == FACE_FILTER_CANDIDATE_COUNT) break;
        }
        List<SpotImageResponse> immutableResults = keepImagesWithoutFaces(results).stream()
                .limit(3)
                .toList();
        imageCache.put(cacheKey, new CachedImages(
                immutableResults,
                System.currentTimeMillis() + IMAGE_CACHE_TTL_MILLIS
        ));
        return immutableResults;
    }

    private TourismBatchLookup findTourismMatches(List<SpotImageQuery> spots) {
        Map<Long, TourismPlace> matches = new LinkedHashMap<>();
        Map<Long, String> regionHints = new LinkedHashMap<>();
        if (tourApiServiceKey == null || tourApiServiceKey.isBlank()) {
            return new TourismBatchLookup(matches, regionHints);
        }

        List<SpotImageQuery> remaining = spots.stream()
                .filter(SpotSearchService::hasValidCoordinates)
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        while (!remaining.isEmpty()) {
            SpotImageQuery seed = remaining.get(0);
            List<SpotImageQuery> cluster = remaining.stream()
                    .filter(spot -> distanceMeters(
                            seed.latitude(), seed.longitude(),
                            spot.latitude(), spot.longitude()
                    ) <= TOUR_CLUSTER_DISTANCE_METERS)
                    .toList();
            remaining.removeAll(cluster);

            double centerLongitude = cluster.stream().mapToDouble(SpotImageQuery::longitude).average().orElse(seed.longitude());
            double centerLatitude = cluster.stream().mapToDouble(SpotImageQuery::latitude).average().orElse(seed.latitude());
            double furthestSpot = cluster.stream()
                    .mapToDouble(spot -> distanceMeters(
                            centerLatitude, centerLongitude,
                            spot.latitude(), spot.longitude()
                    ))
                    .max()
                    .orElse(0d);
            int radius = (int) Math.ceil(Math.min(
                    TOUR_MAX_RADIUS_METERS,
                    Math.max(3_000d, furthestSpot + TOUR_RADIUS_MARGIN_METERS)
            ));

            List<TourismPlace> candidates;
            try {
                candidates = requestNearbyTourismPlaces(centerLongitude, centerLatitude, radius);
            } catch (RestClientException | IllegalStateException ignored) {
                continue;
            }

            for (SpotImageQuery spot : cluster) {
                TourismPlace best = bestTourismMatch(spot, candidates);
                if (best != null) matches.put(spot.id(), best);
                String regionHint = nearestRegionHint(spot, candidates);
                if (!regionHint.isBlank()) regionHints.put(spot.id(), regionHint);
            }
        }
        return new TourismBatchLookup(matches, regionHints);
    }

    private List<TourismPlace> requestNearbyTourismPlaces(double longitude, double latitude, int radius) {
        String uri = UriComponentsBuilder.fromPath("/locationBasedList2")
                .queryParam("serviceKey", tourApiServiceKey)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "Spovisor")
                .queryParam("_type", "json")
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", TOUR_LOCATION_PAGE_SIZE)
                .queryParam("arrange", "E")
                .queryParam("mapX", longitude)
                .queryParam("mapY", latitude)
                .queryParam("radius", radius)
                .build()
                .toUriString();

        JsonNode root = tourRestClient.get()
                .uri(uri)
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .body(JsonNode.class);
        JsonNode items = tourItems(root);
        if (items == null) return List.of();

        List<TourismPlace> results = new ArrayList<>();
        if (items.isArray()) {
            items.forEach(item -> addTourismPlace(results, item));
        } else if (items.isObject()) {
            addTourismPlace(results, items);
        }
        return List.copyOf(results);
    }

    private List<SpotImageResponse> searchTourismImages(TourismPlace place) {
        List<SpotImageResponse> results = new ArrayList<>();
        try {
            String uri = UriComponentsBuilder.fromPath("/detailImage2")
                    .queryParam("serviceKey", tourApiServiceKey)
                    .queryParam("MobileOS", "ETC")
                    .queryParam("MobileApp", "Spovisor")
                    .queryParam("_type", "json")
                    .queryParam("pageNo", 1)
                    .queryParam("numOfRows", FACE_FILTER_CANDIDATE_COUNT)
                    .queryParam("contentId", place.contentId())
                    .queryParam("imageYN", "Y")
                    .build()
                    .toUriString();
            JsonNode root = tourRestClient.get()
                    .uri(uri)
                    .header(HttpHeaders.ACCEPT, "application/json")
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode items = tourItems(root);
            if (items != null) {
                if (items.isArray()) {
                    items.forEach(item -> addTourismImage(results, item));
                } else if (items.isObject()) {
                    addTourismImage(results, items);
                }
            }
        } catch (RestClientException | IllegalStateException ignored) {
            // 대표 이미지는 위치기반 조회 응답에서 아래 fallback으로 사용한다.
        }

        if (results.isEmpty() && !place.firstImage().isBlank()) {
            String image = secureTourismImageUrl(place.firstImage());
            String thumbnail = secureTourismImageUrl(place.firstImage2());
            results.add(new SpotImageResponse(image, thumbnail.isBlank() ? image : thumbnail, "한국관광공사"));
        }

        Set<String> seen = new LinkedHashSet<>();
        List<SpotImageResponse> uniqueResults = results.stream()
                .filter(image -> !image.imageUrl().isBlank())
                .filter(image -> seen.add(image.imageUrl()))
                .toList();
        return keepImagesWithoutFaces(uniqueResults).stream()
                .limit(3)
                .toList();
    }

    private List<SpotImageResponse> keepImagesWithoutFaces(List<SpotImageResponse> candidates) {
        if (candidates.isEmpty()) return List.of();

        List<String> urls = candidates.stream()
                .map(SpotSearchService::faceCheckUrl)
                .filter(url -> !url.isBlank())
                .distinct()
                .limit(FACE_FILTER_CANDIDATE_COUNT)
                .toList();
        if (urls.isEmpty()) return List.of();

        try {
            JsonNode response = aiRestClient.post()
                    .uri("/images/filter-no-faces")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("urls", urls))
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null || !response.path("safeUrls").isArray()) return List.of();

            Set<String> safeUrls = new LinkedHashSet<>();
            response.path("safeUrls").forEach(node -> {
                String url = node.asText("").trim();
                if (!url.isBlank()) safeUrls.add(url);
            });
            return candidates.stream()
                    .filter(candidate -> safeUrls.contains(faceCheckUrl(candidate)))
                    .toList();
        } catch (RestClientException | IllegalStateException exception) {
            // 검증되지 않은 이미지를 노출하는 것보다 사진을 생략하는 쪽이 안전하다.
            log.warn("얼굴 포함 여부를 확인하지 못해 이미지 후보를 제외합니다: {}", exception.getMessage());
            return List.of();
        }
    }

    private static String faceCheckUrl(SpotImageResponse image) {
        if (image.thumbnailUrl() != null && !image.thumbnailUrl().isBlank()) {
            return image.thumbnailUrl().trim();
        }
        return image.imageUrl() == null ? "" : image.imageUrl().trim();
    }

    private JsonNode requestNaverImagesWithRateLimit(String uri) {
        synchronized (imageRequestLock) {
            waitForImageRequestWindow();
            for (int attempt = 0; attempt < 3; attempt++) {
                try {
                    JsonNode response = naverRestClient.get()
                            .uri(uri)
                            .header("X-Naver-Client-Id", clientId)
                            .header("X-Naver-Client-Secret", clientSecret)
                            .header(HttpHeaders.ACCEPT, "application/json")
                            .retrieve()
                            .body(JsonNode.class);
                    lastImageRequestAt = System.currentTimeMillis();
                    return response;
                } catch (HttpClientErrorException.TooManyRequests exception) {
                    lastImageRequestAt = System.currentTimeMillis();
                    if (attempt == 2) throw exception;
                    sleep(600L * (attempt + 1));
                }
            }
            throw new IllegalStateException("네이버 이미지 검색 요청을 처리하지 못했습니다.");
        }
    }

    private void waitForImageRequestWindow() {
        long waitMillis = IMAGE_REQUEST_INTERVAL_MILLIS - (System.currentTimeMillis() - lastImageRequestAt);
        if (waitMillis > 0) sleep(waitMillis);
    }

    private TourSessionCache tourSessionCache(String sessionId) {
        long now = System.currentTimeMillis();
        tourismSessionCaches.entrySet().removeIf(entry -> entry.getValue().expiresAt() <= now);
        if (sessionId == null) return null;
        String normalized = sessionId.trim();
        if (!normalized.matches("[A-Za-z0-9_-]{4,120}")) return null;
        return tourismSessionCaches.compute(normalized, (key, existing) -> {
            if (existing != null && existing.expiresAt() > now) return existing;
            return new TourSessionCache(
                    now + TOUR_SESSION_CACHE_TTL_MILLIS,
                    new ConcurrentHashMap<>()
            );
        });
    }

    private static String spotCacheKey(SpotImageQuery spot) {
        String longitude = spot.longitude() == null ? "" : String.format(Locale.ROOT, "%.5f", spot.longitude());
        String latitude = spot.latitude() == null ? "" : String.format(Locale.ROOT, "%.5f", spot.latitude());
        return normalizeName(spot.name()) + "|" + longitude + "|" + latitude;
    }

    static String buildNaverImageQuery(String name, String regionHint, String category) {
        List<String> parts = new ArrayList<>();
        String searchableName = name.trim()
                .replaceAll("[/|·,()\\[\\]_-]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        parts.add(searchableName);
        String categoryText = category == null ? "" : category.trim();
        boolean commercialPlace = categoryText.contains("카페")
                || categoryText.contains("음식")
                || categoryText.contains("맛집")
                || categoryText.contains("쇼핑");
        String searchRegion = commercialPlace
                ? compactRegionHint(regionHint)
                : isDistinctiveLandmarkName(searchableName) ? "" : regionHint == null ? "" : regionHint.trim();
        if (!searchRegion.isBlank()) parts.add(searchRegion);

        if (categoryText.contains("카페")) parts.add("카페");
        else if (categoryText.contains("음식") || categoryText.contains("맛집")) parts.add("음식");
        else if (categoryText.contains("쇼핑")) parts.add("매장");
        else parts.add("전경");
        return String.join(" ", parts);
    }

    private static boolean isDistinctiveLandmarkName(String name) {
        return name.endsWith("역")
                || name.contains("경기장")
                || name.contains("스타디움")
                || name.contains("라이온즈파크")
                || name.contains("구장")
                || name.contains("스카이돔")
                || name.contains("체육관")
                || name.contains("박물관")
                || name.contains("미술관")
                || name.contains("문화공간")
                || name.contains("수목원")
                || name.endsWith("공원");
    }

    static boolean isClearlyNonPhysicalSpot(String name) {
        String normalized = normalizeName(name);
        boolean remote = normalized.contains("원격")
                || normalized.contains("온라인")
                || normalized.contains("사이버");
        boolean education = normalized.contains("교육원")
                || normalized.contains("학원")
                || normalized.contains("아카데미")
                || normalized.contains("학교");
        return remote && education;
    }

    private static String compactRegionHint(String regionHint) {
        if (regionHint == null || regionHint.isBlank()) return "";
        String[] addressParts = regionHint.trim().split("\\s+");
        String localRegion = addressParts[addressParts.length - 1];
        if (localRegion.length() > 2 && localRegion.endsWith("시")) {
            return localRegion.substring(0, localRegion.length() - 1);
        }
        return localRegion;
    }

    static boolean isBlockedNaverImage(
            String spotName,
            String title,
            String imageUrl,
            int width,
            int height,
            String category
    ) {
        String normalizedTitle = title == null ? "" : title.toLowerCase(Locale.ROOT);
        if (BLOCKED_NAVER_TITLE_TERMS.stream().anyMatch(normalizedTitle::contains)) return true;
        if (NON_PHOTO_TITLE_TERMS.stream().anyMatch(normalizedTitle::contains)) return true;
        String categoryText = category == null ? "" : category;
        boolean accommodation = categoryText.contains("숙박");
        boolean foodPlace = categoryText.contains("카페")
                || categoryText.contains("음식")
                || categoryText.contains("맛집");
        if (!accommodation && LODGING_TITLE_TERMS.stream().anyMatch(normalizedTitle::contains)) return true;
        if (!foodPlace && FOOD_TITLE_TERMS.stream().anyMatch(normalizedTitle::contains)) return true;
        if (!hasUsableImageDimensions(width, height)) return true;
        if (!naverTitleMatchesSpot(spotName, normalizedTitle)) return true;
        String normalizedHost = imageHost(imageUrl);
        return !normalizedHost.isBlank()
                && BLOCKED_NAVER_HOST_PARTS.stream().anyMatch(normalizedHost::contains);
    }

    private static boolean hasUsableImageDimensions(int width, int height) {
        if (width <= 0 || height <= 0) return true;
        if (Math.min(width, height) < 180) return false;
        double aspectRatio = (double) width / height;
        return aspectRatio >= 0.42d && aspectRatio <= 2.4d;
    }

    private static int naverImageScore(String spotName, String title, String imageUrl, int order) {
        String normalizedTitle = normalizeName(title);
        String normalizedSpotName = normalizeName(spotName);
        String host = imageHost(imageUrl);
        int score = -order;
        if (host.contains("ldb-phinf.pstatic.net")) score += 120;
        else if (host.contains("upload.wikimedia.org")) score += 70;
        else if (host.contains("pup-post-phinf.pstatic.net")
                || host.contains("postfiles.pstatic.net")
                || host.contains("blog.kakaocdn.net")
                || host.contains("img1.daumcdn.net")
                || host.contains("t1.daumcdn.net")
                || host.contains("fastly.4sqi.net")) score += 30;
        if (normalizedTitle.equals(normalizedSpotName)) score += 70;
        else if (normalizedTitle.contains(normalizedSpotName)) score += 35;
        return score;
    }

    private static String imageHost(String imageUrl) {
        try {
            String host = URI.create(imageUrl).getHost();
            return host == null ? "" : host.toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException ignored) {
            return "";
        }
    }

    private static boolean naverTitleMatchesSpot(String spotName, String title) {
        String normalizedTitle = normalizeName(title);
        String normalizedSpotName = normalizeName(spotName);
        if (normalizedTitle.contains(normalizedSpotName)) return true;
        return java.util.Arrays.stream(spotName.split("[/,()\\[\\]_-]+"))
                .map(SpotSearchService::normalizeName)
                .filter(part -> part.length() >= 3)
                .anyMatch(normalizedTitle::contains);
    }

    private static String nearestRegionHint(SpotImageQuery spot, List<TourismPlace> candidates) {
        TourismPlace nearest = null;
        double nearestDistance = TOUR_MAX_RADIUS_METERS;
        for (TourismPlace candidate : candidates) {
            if (candidate.address().isBlank()) continue;
            double distance = distanceMeters(
                    spot.latitude(), spot.longitude(),
                    candidate.latitude(), candidate.longitude()
            );
            if (distance < nearestDistance) {
                nearest = candidate;
                nearestDistance = distance;
            }
        }
        if (nearest == null) return "";
        String[] addressParts = nearest.address().split("\\s+");
        if (addressParts.length == 0) return "";
        return addressParts.length == 1
                ? addressParts[0]
                : addressParts[0] + " " + addressParts[1];
    }

    private String resolveNaverRegionHint(SpotImageQuery spot, String fallback) {
        if (!hasValidCoordinates(spot)) return fallback;
        try {
            SpotSearchResponse nearest = null;
            double nearestDistance = TOUR_MAX_RADIUS_METERS;
            for (SpotSearchResponse candidate : search(spot.name())) {
                if (candidate.longitude() == null || candidate.latitude() == null) continue;
                if (!naverTitleMatchesSpot(spot.name(), candidate.name())) continue;
                double distance = distanceMeters(
                        spot.latitude(), spot.longitude(),
                        candidate.latitude(), candidate.longitude()
                );
                if (distance < nearestDistance) {
                    nearest = candidate;
                    nearestDistance = distance;
                }
            }
            if (nearest == null) return fallback;
            String address = nearest.roadAddress() == null || nearest.roadAddress().isBlank()
                    ? nearest.address()
                    : nearest.roadAddress();
            if (address == null || address.isBlank()) return fallback;
            String[] addressParts = address.trim().split("\\s+");
            if (addressParts.length == 0) return fallback;
            return addressParts.length == 1
                    ? addressParts[0]
                    : addressParts[0] + " " + addressParts[1];
        } catch (RestClientException | IllegalArgumentException ignored) {
            return fallback;
        }
    }

    private static TourismPlace bestTourismMatch(SpotImageQuery spot, List<TourismPlace> candidates) {
        String targetName = normalizeName(spot.name());
        TourismPlace best = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        for (TourismPlace candidate : candidates) {
            String candidateName = normalizeName(candidate.title());
            double distance = distanceMeters(
                    spot.latitude(), spot.longitude(),
                    candidate.latitude(), candidate.longitude()
            );
            boolean exact = candidateName.equals(targetName);
            boolean partial = Math.min(candidateName.length(), targetName.length()) >= 3
                    && (candidateName.contains(targetName) || targetName.contains(candidateName));
            if ((!exact || distance > TOUR_EXACT_NAME_MAX_DISTANCE_METERS)
                    && (!partial || distance > TOUR_PARTIAL_NAME_MAX_DISTANCE_METERS)) {
                continue;
            }

            double score = (exact ? 10_000d : 5_000d) - distance;
            if (score > bestScore) {
                best = candidate;
                bestScore = score;
            }
        }
        return best;
    }

    private static JsonNode tourItems(JsonNode root) {
        if (root == null) return null;
        JsonNode response = root.path("response");
        if (!"0000".equals(response.path("header").path("resultCode").asText())) return null;
        JsonNode item = response.path("body").path("items").path("item");
        return item.isMissingNode() || item.isNull() ? null : item;
    }

    private static void addTourismPlace(List<TourismPlace> results, JsonNode item) {
        String contentId = item.path("contentid").asText("").trim();
        String title = clean(item.path("title").asText(""));
        Double longitude = number(item.path("mapx"));
        Double latitude = number(item.path("mapy"));
        if (contentId.isBlank() || title.isBlank() || longitude == null || latitude == null) return;
        results.add(new TourismPlace(
                contentId,
                title,
                longitude,
                latitude,
                item.path("firstimage").asText("").trim(),
                item.path("firstimage2").asText("").trim(),
                item.path("addr1").asText("").trim()
        ));
    }

    private static void addTourismImage(List<SpotImageResponse> results, JsonNode item) {
        String image = secureTourismImageUrl(item.path("originimgurl").asText(""));
        String thumbnail = secureTourismImageUrl(item.path("smallimageurl").asText(""));
        if (image.isBlank() && thumbnail.isBlank()) return;
        results.add(new SpotImageResponse(
                image.isBlank() ? thumbnail : image,
                thumbnail.isBlank() ? image : thumbnail,
                "한국관광공사"
        ));
    }

    private static boolean hasValidCoordinates(SpotImageQuery spot) {
        return spot != null
                && spot.longitude() != null
                && spot.latitude() != null
                && Double.isFinite(spot.longitude())
                && Double.isFinite(spot.latitude())
                && Math.abs(spot.longitude()) <= 180d
                && Math.abs(spot.latitude()) <= 90d
                && !(spot.longitude() == 0d && spot.latitude() == 0d);
    }

    private static String normalizeName(String value) {
        String normalized = Normalizer.normalize(clean(value), Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[^\\p{L}\\p{N}]", "");
    }

    private static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6_371_000d;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2d) * Math.sin(latDistance / 2d)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2d) * Math.sin(lonDistance / 2d);
        return earthRadius * 2d * Math.atan2(Math.sqrt(a), Math.sqrt(1d - a));
    }

    private static Double number(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        try {
            return Double.parseDouble(node.asText());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String secureTourismImageUrl(String value) {
        String url = value == null ? "" : value.trim();
        if (url.startsWith("http://tong.visitkorea.or.kr/")) {
            return "https://" + url.substring("http://".length());
        }
        return url;
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("네이버 이미지 검색 대기 중 요청이 중단되었습니다.", exception);
        }
    }

    @PreDestroy
    void shutdownTourImageExecutor() {
        tourImageExecutor.shutdown();
        try {
            if (!tourImageExecutor.awaitTermination(2, TimeUnit.SECONDS)) {
                tourImageExecutor.shutdownNow();
            }
        } catch (InterruptedException exception) {
            tourImageExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    private record CachedImages(List<SpotImageResponse> images, long expiresAt) {
    }

    private record NaverImageCandidate(
            String imageUrl,
            String thumbnailUrl,
            String title,
            int score,
            int order
    ) {
    }

    private record TourSessionCache(
            long expiresAt,
            Map<String, TourismImageLookup> spots
    ) {
    }

    private record TourismImageLookup(
            List<SpotImageResponse> images,
            String regionHint
    ) {
        private static TourismImageLookup empty() {
            return new TourismImageLookup(List.of(), "");
        }
    }

    private record TourismBatchLookup(
            Map<Long, TourismPlace> matches,
            Map<Long, String> regionHints
    ) {
    }

    private record TourismPlace(
            String contentId,
            String title,
            double longitude,
            double latitude,
            String firstImage,
            String firstImage2,
            String address
    ) {
    }

    private static String clean(String value) {
        return value == null ? "" : value.replaceAll("<[^>]+>", "").trim();
    }

    private static Double naverCoordinate(String raw, boolean longitude) {
        if (raw == null || raw.isBlank()) return null;
        try {
            double value = Double.parseDouble(raw);
            if (Math.abs(value) > (longitude ? 180 : 90)) value /= 10_000_000d;
            return value;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
