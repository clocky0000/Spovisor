package com.spovisor.backend.config;

import com.spovisor.backend.auth.LegalDocumentVersions;
import com.spovisor.backend.feature.SavedCourseRepository;
import com.spovisor.backend.feature.TripHistoryRepository;
import com.spovisor.backend.user.FavoriteTeamRepository;
import com.spovisor.backend.user.User;
import com.spovisor.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ReviewerAccountInitializerTest {

    @Test
    void createsAnIdempotentReviewerAccountWithoutPersistingPlaintextPassword() {
        UserRepository repository = mock(UserRepository.class);
        SeedHistoryRepository seedHistoryRepository = mock(SeedHistoryRepository.class);
        FavoriteTeamRepository favoriteTeamRepository = mock(FavoriteTeamRepository.class);
        SavedCourseRepository savedCourseRepository = mock(SavedCourseRepository.class);
        TripHistoryRepository tripHistoryRepository = mock(TripHistoryRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(repository.findByEmail("reviewer@spovisor.kr")).thenReturn(Optional.empty());
        when(encoder.encode("review-password")).thenReturn("bcrypt-hash");

        ReviewerAccountInitializer initializer = new ReviewerAccountInitializer(
                repository,
                seedHistoryRepository,
                favoriteTeamRepository,
                savedCourseRepository,
                tripHistoryRepository,
                encoder,
                " Reviewer@Spovisor.kr ",
                "review-password",
                "민서"
        );

        initializer.run(null);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(repository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("reviewer@spovisor.kr");
        assertThat(saved.getPasswordHash()).isEqualTo("bcrypt-hash");
        assertThat(saved.hasLegalConsentVersions(
                LegalDocumentVersions.TERMS,
                LegalDocumentVersions.PRIVACY
        )).isTrue();
        verify(favoriteTeamRepository).save(org.mockito.ArgumentMatchers.any());
        verify(savedCourseRepository).save(org.mockito.ArgumentMatchers.any());
        verify(tripHistoryRepository).save(org.mockito.ArgumentMatchers.any());
        verify(seedHistoryRepository).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void refusesToStartWhenEnabledPasswordIsTooShort() {
        ReviewerAccountInitializer initializer = new ReviewerAccountInitializer(
                mock(UserRepository.class),
                mock(SeedHistoryRepository.class),
                mock(FavoriteTeamRepository.class),
                mock(SavedCourseRepository.class),
                mock(TripHistoryRepository.class),
                mock(PasswordEncoder.class),
                "reviewer@spovisor.kr",
                "short",
                "민서"
        );

        assertThatThrownBy(() -> initializer.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("REVIEWER_ACCOUNT_PASSWORD");
    }

    @Test
    void leavesAnExistingAccountAndItsUserDataUntouched() {
        UserRepository repository = mock(UserRepository.class);
        SeedHistoryRepository seedHistoryRepository = mock(SeedHistoryRepository.class);
        FavoriteTeamRepository favoriteTeamRepository = mock(FavoriteTeamRepository.class);
        SavedCourseRepository savedCourseRepository = mock(SavedCourseRepository.class);
        TripHistoryRepository tripHistoryRepository = mock(TripHistoryRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User existing = new User("minseo.kim@naver.com", "existing-hash", "민서");
        when(repository.findByEmail("minseo.kim@naver.com")).thenReturn(Optional.of(existing));

        ReviewerAccountInitializer initializer = new ReviewerAccountInitializer(
                repository,
                seedHistoryRepository,
                favoriteTeamRepository,
                savedCourseRepository,
                tripHistoryRepository,
                encoder,
                "minseo.kim@naver.com",
                "Travel!2026_0915",
                "민서"
        );

        initializer.run(null);

        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
        verifyNoInteractions(encoder, favoriteTeamRepository, savedCourseRepository, tripHistoryRepository);
        verify(seedHistoryRepository).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void doesNotRecreateADeletedAccountAfterTheInitialSeedWasApplied() {
        UserRepository repository = mock(UserRepository.class);
        SeedHistoryRepository seedHistoryRepository = mock(SeedHistoryRepository.class);
        FavoriteTeamRepository favoriteTeamRepository = mock(FavoriteTeamRepository.class);
        SavedCourseRepository savedCourseRepository = mock(SavedCourseRepository.class);
        TripHistoryRepository tripHistoryRepository = mock(TripHistoryRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(seedHistoryRepository.existsById("natural-account-v1")).thenReturn(true);

        ReviewerAccountInitializer initializer = new ReviewerAccountInitializer(
                repository,
                seedHistoryRepository,
                favoriteTeamRepository,
                savedCourseRepository,
                tripHistoryRepository,
                encoder,
                "minseo.kim@naver.com",
                "Travel!2026_0915",
                "민서"
        );

        initializer.run(null);

        verify(seedHistoryRepository).existsById("natural-account-v1");
        verify(seedHistoryRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verifyNoInteractions(repository, encoder, favoriteTeamRepository, savedCourseRepository, tripHistoryRepository);
    }
}
