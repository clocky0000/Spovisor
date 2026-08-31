package com.spovisor.backend.spot;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Service
public class SpotSearchService {
    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;

    public SpotSearchService(
            RestClient.Builder restClientBuilder,
            @Value("${app.naver.local.client-id:}") String clientId,
            @Value("${app.naver.local.client-secret:}") String clientSecret
    ) {
        this.restClient = restClientBuilder.baseUrl("https://openapi.naver.com").build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
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
        JsonNode root = restClient.get()
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
            String contentId = "naver-" + Integer.toUnsignedString((name + "|" + roadAddress + "|" + longitude + "|" + latitude).hashCode());
            results.add(new SpotSearchResponse(contentId, name, clean(item.path("category").asText()), null, null,
                    longitude, latitude, address, roadAddress, providerId));
        }
        return results;
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
