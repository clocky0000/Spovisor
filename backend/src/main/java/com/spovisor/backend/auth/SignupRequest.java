package com.spovisor.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

public record SignupRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 50) String nickname,
        @AssertTrue(message = "서비스 이용약관 동의가 필요합니다.") boolean termsAccepted,
        @AssertTrue(message = "개인정보 수집·이용 동의가 필요합니다.") boolean privacyAccepted
) {
}
