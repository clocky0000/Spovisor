package com.spovisor.backend.auth;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SignupRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void bothRequiredConsentsMustBeAccepted() {
        SignupRequest request = new SignupRequest(
                "user@example.com",
                "password123",
                "여행자",
                false,
                false
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("termsAccepted", "privacyAccepted");
    }

    @Test
    void validSignupRequestPassesValidation() {
        SignupRequest request = new SignupRequest(
                "user@example.com",
                "password123",
                "여행자",
                true,
                true
        );

        assertThat(validator.validate(request)).isEmpty();
    }
}
