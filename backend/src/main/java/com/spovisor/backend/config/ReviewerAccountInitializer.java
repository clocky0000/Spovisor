package com.spovisor.backend.config;

import com.spovisor.backend.auth.LegalDocumentVersions;
import com.spovisor.backend.feature.SavedCourse;
import com.spovisor.backend.feature.SavedCourseRepository;
import com.spovisor.backend.feature.TripHistory;
import com.spovisor.backend.feature.TripHistoryRepository;
import com.spovisor.backend.user.FavoriteTeam;
import com.spovisor.backend.user.FavoriteTeamRepository;
import com.spovisor.backend.user.User;
import com.spovisor.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
@ConditionalOnProperty(name = "app.reviewer-account.enabled", havingValue = "true")
public class ReviewerAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ReviewerAccountInitializer.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final String SEED_KEY = "natural-account-v1";
    private static final String SAMPLE_COURSE_TITLE = "잠실 야구 나들이";
    private static final String SAMPLE_COURSE_JSON = """
            {
              "id": 99001,
              "code": "A",
              "title": "잠실 야구 나들이",
              "conceptTag": "스포츠·도심 여행",
              "duration": "약 4시간",
              "moveTime": "대중교통 약 30분",
              "distance": "약 4.2km",
              "routeText": "서울책보고 ➔ 석촌호수 ➔ 서울종합운동장야구장",
              "tags": [
                {"emoji": "⚾", "label": "야구"},
                {"emoji": "🚇", "label": "대중교통"}
              ],
              "description": "책과 호수 산책을 즐긴 뒤 야구를 관람하는 여유로운 서울 나들이 코스입니다.",
              "spots": [
                {
                  "id": 99001,
                  "name": "서울책보고",
                  "category": "문화시설",
                  "time": "13:00",
                  "stayTime": "60분",
                  "moveText": "지하철 이동",
                  "description": "책과 전시를 즐길 수 있는 문화 공간",
                  "emoji": "📚",
                  "visited": true,
                  "map_x": "127.104850",
                  "map_y": "37.521640",
                  "day": 1
                },
                {
                  "id": 99002,
                  "name": "석촌호수",
                  "category": "자연",
                  "time": "14:30",
                  "stayTime": "60분",
                  "moveText": "도보 및 지하철 이동",
                  "description": "경기 전 산책하기 좋은 도심 호수",
                  "emoji": "🌳",
                  "visited": true,
                  "map_x": "127.100120",
                  "map_y": "37.508390",
                  "day": 1
                },
                {
                  "id": 99003,
                  "name": "서울종합운동장야구장",
                  "category": "스포츠",
                  "time": "17:00",
                  "stayTime": "경기 종료까지",
                  "moveText": "지하철 이동",
                  "description": "스포츠 경기를 관람하는 코스의 목적지",
                  "emoji": "⚾",
                  "visited": true,
                  "map_x": "127.071990",
                  "map_y": "37.512150",
                  "day": 1
                }
              ],
              "saved": true
            }
            """;

    private final UserRepository userRepository;
    private final SeedHistoryRepository seedHistoryRepository;
    private final FavoriteTeamRepository favoriteTeamRepository;
    private final SavedCourseRepository savedCourseRepository;
    private final TripHistoryRepository tripHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String nickname;

    public ReviewerAccountInitializer(
            UserRepository userRepository,
            SeedHistoryRepository seedHistoryRepository,
            FavoriteTeamRepository favoriteTeamRepository,
            SavedCourseRepository savedCourseRepository,
            TripHistoryRepository tripHistoryRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.reviewer-account.email:}") String email,
            @Value("${app.reviewer-account.password:}") String password,
            @Value("${app.reviewer-account.nickname:민서}") String nickname
    ) {
        this.userRepository = userRepository;
        this.seedHistoryRepository = seedHistoryRepository;
        this.favoriteTeamRepository = favoriteTeamRepository;
        this.savedCourseRepository = savedCourseRepository;
        this.tripHistoryRepository = tripHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.nickname = nickname;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (seedHistoryRepository.existsById(SEED_KEY)) {
            log.info("Initial account seed was already applied; initialization skipped.");
            return;
        }

        String normalizedEmail = validateAndNormalizeEmail(email);
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            seedHistoryRepository.save(new SeedHistory(SEED_KEY));
            log.info("Seed account already exists; future initialization disabled.");
            return;
        }

        validatePassword(password);
        String normalizedNickname = validateNickname(nickname);

        User user = new User(normalizedEmail, passwordEncoder.encode(password), normalizedNickname);
        user.recordLegalConsent(LegalDocumentVersions.TERMS, LegalDocumentVersions.PRIVACY);
        userRepository.save(user);
        seedFeatureData(user.getId());
        seedHistoryRepository.save(new SeedHistory(SEED_KEY));
        log.info("Seed account and initial sample data created.");
    }

    private void seedFeatureData(Long userId) {
        if (!favoriteTeamRepository.existsByUserIdAndSportAndTeamName(userId, "baseball", "LG")) {
            favoriteTeamRepository.save(new FavoriteTeam(userId, "baseball", "LG", "트윈스"));
        }

        if (!savedCourseRepository.existsByUserIdAndTitle(userId, SAMPLE_COURSE_TITLE)) {
            savedCourseRepository.save(new SavedCourse(
                    userId,
                    SAMPLE_COURSE_TITLE,
                    "서울종합운동장야구장",
                    "스포츠·도심 여행",
                    SAMPLE_COURSE_JSON
            ));
        }

        if (!tripHistoryRepository.existsByUserIdAndCourseTitleAndStatus(
                userId,
                SAMPLE_COURSE_TITLE,
                "COMPLETED"
        )) {
            TripHistory completedTrip = new TripHistory(
                    userId,
                    "서울종합운동장야구장",
                    "LG vs 두산",
                    LocalDate.now().minusDays(7),
                    SAMPLE_COURSE_TITLE,
                    SAMPLE_COURSE_JSON
            );
            completedTrip.addFeedback(5, "99001,99002,99003");
            tripHistoryRepository.save(completedTrip);
        }
    }

    private String validateAndNormalizeEmail(String rawEmail) {
        String value = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(value).matches()) {
            throw new IllegalStateException("REVIEWER_ACCOUNT_EMAIL must be a valid email address.");
        }
        return value;
    }

    private void validatePassword(String rawPassword) {
        int length = rawPassword == null ? 0 : rawPassword.length();
        if (length < 8 || length > 100) {
            throw new IllegalStateException("REVIEWER_ACCOUNT_PASSWORD must contain 8 to 100 characters.");
        }
    }

    private String validateNickname(String rawNickname) {
        String value = rawNickname == null ? "" : rawNickname.trim();
        if (value.isEmpty() || value.length() > 50) {
            throw new IllegalStateException("REVIEWER_ACCOUNT_NICKNAME must contain 1 to 50 characters.");
        }
        return value;
    }
}
