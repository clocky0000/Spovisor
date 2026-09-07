package com.spovisor.backend.feature;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiIntegrationController {

    private final AiIntegrationService aiIntegrationService;

    // 프론트엔드 -> 백엔드 -> AI 피드백 요청 및 즉각 응답
    @PostMapping("/feedback")
    public ResponseEntity<String> feedback(@RequestBody FeedbackRequestDto request) {

        // AiIntegrationService의 동기 메서드 호출
        String aiResponse = aiIntegrationService.requestFeedbackToAi(
                request.user_result(),
                request.region(),
                request.getSafeLikedSpots(),
                request.getSafeDislikedSpots()
        );

        // AI 서버에서 받은 새로운 코스 3개(JSON 문자열)를 그대로 프론트엔드에 반환
        return ResponseEntity.ok(aiResponse);
    }
}