package com.spovisor.backend.feature;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiIntegrationController {

    private final AiIntegrationService aiIntegrationService;

    @PostMapping(value = "/feedback", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> feedback(@RequestBody FeedbackRequestDto request) {
        try {
            String aiResponse = aiIntegrationService.requestFeedbackToAi(
                    request.user_result(),
                    request.region(),
                    request.getSafeLikedSpots(),
                    request.getSafeDislikedSpots()
            );
            return ResponseEntity.ok(aiResponse);
        } catch (Exception e) {
            log.error("AI 피드백 연동 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\":\"AI 서버 응답 처리 중 오류가 발생했습니다.\"}");
        }
    }
}