import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Coffee,
  Filter,
  Heart,
  Home,
  Map as MapIcon,
  Navigation,
  Pencil,
  RotateCcw,
  Share2,
  ShoppingBag,
  Star,
  User,
  X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addFavoritePlace,
  changePassword,
  clearAuthSession,
  createRecommendationRequest,
  createTrip,
  deleteFavoritePlace,
  deleteMyAccount,
  deleteSavedCourse,
  getMyProfile,
  listFavoritePlaces,
  listFavoriteTeams,
  listSavedCourses,
  listTrips,
  loadAuthSession,
  replaceFavoriteTeams,
  saveAuthSession,
  saveCourse,
  saveUserSurvey,
  searchSpots,
  submitTripFeedback,
  updateMyProfile,
  type FavoritePlace,
  type FavoriteTeam,
  type SavedCourse,
  type SpotSearchResult,
  type Trip,
  type UserProfile,
} from '../lib/api';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type LoginScreenType = 'splash' | 'idLogin';

type Sport = 'baseball' | 'soccer' | 'volleyball';
type TabType = 'home' | 'course' | 'saved' | 'my';
type MyPageSection = 'menu' | 'account' | 'teams' | 'trips' | 'support';
type FlowStep =
  | 'home'
  | 'gameInfo'
  | 'transport'
  | 'companion'
  | 'concept'
  | 'places'
  | 'courseList'
  | 'courseDetail'
  | 'mapView'
  | 'feedbackReview'
  | 'feedbackDone'
  | 'presetCourseDetail'
  | 'customizeMascot';

interface Game {
  id: number;
  sport: Sport;
  home: string;
  away: string;
  homeEmoji: string;
  stadium: string;
  time: string;
  date: string;
}

const currentDateKey = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
})();

const TEAM_OPTIONS: { sport: Sport; label: string; teams: string[] }[] = [
  { sport: 'baseball', label: '야구', teams: ['LG', '두산', '키움', 'SSG', 'kt', 'KIA', '삼성', '롯데', 'NC', '한화'] },
  { sport: 'soccer', label: '축구', teams: ['FC 서울', '전북 현대', '울산 HD', '수원 삼성', '수원FC', '대전 하나', '인천 유나이티드', '포항 스틸러스', '제주 SK', '광주FC', '강원FC', '대구FC'] },
  { sport: 'volleyball', label: '배구', teams: ['대한항공', '우리카드', '현대캐피탈', '삼성화재', 'OK저축은행', 'KB손해보험'] },
];

interface CourseSpot {
  id: number;
  name: string;
  category: string;
  time: string;
  stayTime?: string;
  moveText?: string;
  description: string;
  emoji: string;
  visited?: boolean;
}

interface Course {
  id: number;
  code: string;
  title: string;
  conceptTag: string;
  duration: string;
  moveTime: string;
  distance: string;
  routeText: string;
  tags: { emoji: string; label: string }[];
  description: string;
  spots: CourseSpot[];
  saved: boolean;
}

interface PresetCourse {
  id: number;
  title: string;
  routeText: string;
  time: string;
  distance: string;
  difficulty: '쉬움' | '보통' | '어려움';
  rating: number;
  nodes: string[];
  icon: string;
}

interface MascotOption {
  id: string;
  name: string;
  emoji: string;
}

interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

const CONCEPT_PREVIEWS: Record<string, {
  emoji: string;
  ratios: { label: string; value: string; color: string }[];
  summary: string;
}> = {
  '미식 탐방형': {
    emoji: '🍜',
    summary: '로컬 맛집과 인기 식당 중심으로 추천해요.',
    ratios: [
      { label: '맛집', value: '60%', color: '#F59E0B' },
      { label: '관광지', value: '20%', color: '#5B44E8' },
      { label: '자연', value: '5%', color: '#10B981' },
      { label: '쇼핑', value: '15%', color: '#10B981' },
    ],
  },
  '관광지 중심형': {
    emoji: '🗺️',
    summary: '대표 관광지와 랜드마크를 우선해서 추천해요.',
    ratios: [
      { label: '맛집', value: '15%', color: '#F59E0B' },
      { label: '관광지', value: '55%', color: '#5B44E8' },
      { label: '자연', value: '20%', color: '#10B981' },
      { label: '쇼핑', value: '10%', color: '#0EA5E9' },
    ],
  },
  '로컬 힐링형': {
    emoji: '🌿',
    summary: '한적하고 여유로운 장소를 중심으로 추천해요.',
    ratios: [
      { label: '맛집', value: '20%', color: '#F59E0B' },
      { label: '관광지', value: '20%', color: '#5B44E8' },
      { label: '자연', value: '45%', color: '#10B981' },
      { label: '쇼핑', value: '15%', color: '#0EA5E9' },
    ],
  },
};

// ─────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────

const GAMES: Game[] = [
  { id: 1, sport: 'baseball', home: 'LG', away: '두산', homeEmoji: '🔴', stadium: '잠실야구장', time: '18:30', date: currentDateKey },
  { id: 2, sport: 'baseball', home: 'kt', away: 'NC', homeEmoji: '⚡', stadium: '수원 KT위즈파크', time: '18:30', date: currentDateKey },
  { id: 3, sport: 'soccer', home: 'FC 서울', away: '전북 현대', homeEmoji: '⚽', stadium: '서울 월드컵경기장', time: '19:00', date: currentDateKey },
];

function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateLabel(value: string) {
  const [year, month, day] = value.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function aiStadiumName(value: string) {
  const aliases: Record<string, string> = {
    '잠실야구장': '서울종합운동장야구장',
    '서울 월드컵경기장': '서울월드컵경기장',
    '수원 KT위즈파크': '수원KT위즈파크',
  };
  return aliases[value] ?? value;
}

const MOCK_COURSES: Course[] = [
  {
    id: 1,
    code: 'A',
    title: 'A코스',
    conceptTag: '미식 중심',
    duration: '3시간 10분',
    moveTime: '35분',
    distance: '4.2km',
    routeText: '수원역 ➔ 로컬 맛집 ➔ 행궁동 카페 ➔ 경기장',
    tags: [
      { emoji: '🍜', label: '맛집' },
      { emoji: '☕', label: '카페' },
      { emoji: '🏟️', label: '경기장' },
    ],
    description: '경기 전 여유로운 로컬 맛집과 카페를 즐기는 미식 중심 코스예요.',
    saved: true,
    spots: [
      { id: 101, name: '수원역 도착', category: '이동', time: '12:00', emoji: '🚆', description: 'KTX · 지하철 1호선' },
      { id: 102, name: '로컬 맛집 점심', category: '맛집', time: '12:25', stayTime: '예상 체류 60분', moveText: '도보 10분', emoji: '🍜', description: '영통구 로컬 한식당', visited: true },
      { id: 103, name: '행궁동 카페게리', category: '카페', time: '13:40', stayTime: '예상 체류 45분', moveText: '도보 15분', emoji: '☕', description: '팔달구 카페 · 수원 화성 근처', visited: true },
      { id: 104, name: '수원 화성 행궁', category: '관광지', time: '14:55', stayTime: '예상 체류 50분', moveText: '도보 12분', emoji: '🏯', description: '세계문화유산 관광', visited: false },
      { id: 105, name: '수원 KT위즈파크 도착', category: '경기장', time: '17:20', moveText: '버스 35분', emoji: '🏟️', description: '팔달구 · 주차 가능', visited: true },
    ],
  },
  {
    id: 2,
    code: 'B',
    title: 'B코스',
    conceptTag: '여유로운 실내',
    duration: '2시간 45분',
    moveTime: '28분',
    distance: '3.8km',
    routeText: '수원역 ➔ 스타필드 ➔ 효뜨 ➔ 경기장',
    tags: [
      { emoji: '🛍️', label: '쇼핑' },
      { emoji: '🍽️', label: '음식점' },
      { emoji: '🏟️', label: '경기장' },
    ],
    description: '스타필드 중심의 실내 쾌적 동선 코스입니다.',
    saved: false,
    spots: [],
  },
  {
    id: 3,
    code: 'C',
    title: 'C코스',
    conceptTag: '로컬 힐링',
    duration: '3시간 30분',
    moveTime: '42분',
    distance: '5.1km',
    routeText: '수원역 ➔ 화성행궁 ➔ 로컬 카페 ➔ 경기장',
    tags: [
      { emoji: '🏯', label: '관광지' },
      { emoji: '☕', label: '카페' },
      { emoji: '🏟️', label: '경기장' },
    ],
    description: '수원 화성 성곽길과 한적한 골목 카페를 거니는 코스입니다.',
    saved: false,
    spots: [],
  },
];

const PRESET_COURSES: PresetCourse[] = [
  { id: 1, title: '지하철 완전정복 코스', routeText: '잠실역 ➔ 잠실야구장', time: '35분', distance: '1.8km', difficulty: '쉬움', rating: 4.9, nodes: ['잠실역 2호선', '잠실나루역', '선수촌공원', '잠실종합운동장'], icon: '🚆' },
  { id: 2, title: '버스 + 맛집 탐방 코스', routeText: '강남역 ➔ 서울 월드컵경기장', time: '55분', distance: '4.2km', difficulty: '보통', rating: 4.7, nodes: ['강남역', '홍대입구역', '망원시장'], icon: '🚌' },
  { id: 3, title: '드라이브 & 파킹 코스', routeText: '올림픽대로 ➔ 잠실야구장', time: '28분', distance: '6.5km', difficulty: '쉬움', rating: 4.5, nodes: ['올림픽대로 진입', '잠실IC', '주차타워 P3'], icon: '🚗' },
  { id: 4, title: '문화 & 쇼핑 루트', routeText: '코엑스 ➔ 수원 월드컵경기장', time: '1시간 20분', distance: '12.3km', difficulty: '어려움', rating: 4.3, nodes: ['코엑스 몰', '강남터미널', '수원역'], icon: '🛍️' },
];

const SAVED_ITEMS = [
  { stadium: '잠실 야구장', type: '지하철 코스', date: '2026.06.22', icon: '⚾' },
  { stadium: '서울 월드컵경기장', type: '버스 탐방 코스', date: '2026.06.18', icon: '⚽' },
  { stadium: '잠실 야구장', type: '드라이브 코스', date: '2026.06.10', icon: '🚗' },
  { stadium: '수원 월드컵경기장', type: '지하철 코스', date: '2026.05.30', icon: '🚆' },
  { stadium: '인천SSG랜더스필드', type: '버스 코스', date: '2026.05.14', icon: '⚾' },
  { stadium: '잠실 야구장', type: '쇼핑 루트', date: '2026.05.01', icon: '🛍️' },
];

const MY_TRIP_LIST = [
  { stadium: '잠실야구장', match: 'LG vs 두산', date: '2026.06.29', tag: '지하철 코스', rating: 5, icon: '⚾' },
  { stadium: '서울 월드컵경기장', match: 'FC서울 vs 전북', date: '2026.06.14', tag: '버스 탐방 코스', rating: 4, icon: '⚽' },
  { stadium: '수원 KT위즈파크', match: 'kt vs NC', date: '2026.05.30', tag: '드라이브 코스', rating: 5, icon: '⚾' },
  { stadium: 'SSG랜더스필드', match: 'SSG vs 롯데', date: '2026.05.14', tag: '지하철 코스', rating: 4, icon: '⚾' },
  { stadium: '광주-기아 챔피언스필드', match: 'KIA vs 삼성', date: '2026.04.20', tag: '버스 코스', rating: 3, icon: '⚾' },
];

const MASCOTS: MascotOption[] = [
  { id: 'trophy', name: '트로피', emoji: '🏆' },
  { id: 'baseball', name: '야구공', emoji: '⚾' },
  { id: 'soccer', name: '축구공', emoji: '⚽' },
  { id: 'basketball', name: '농구공', emoji: '🏀' },
  { id: 'badminton', name: '배드민턴', emoji: '🏸' },
  { id: 'volleyball', name: '배구공', emoji: '🏐' },
  { id: 'goldmedal', name: '금메달', emoji: '🥇' },
  { id: 'stadium', name: '경기장', emoji: '🏟️' },
];

const COLOR_OPTIONS: ColorOption[] = [
  { id: 'indigo', name: '인디고', hex: '#5B44E8' },
  { id: 'red', name: '레드', hex: '#EF4444' },
  { id: 'emerald', name: '에메랄드', hex: '#10B981' },
  { id: 'violet', name: '바이올렛', hex: '#8B5CF6' },
  { id: 'amber', name: '앰버', hex: '#F59E0B' },
  { id: 'sky', name: '스카이', hex: '#0EA5E9' },
];

// ─────────────────────────────────────────────────────────
// Splash & Login Components (Pure StyleSheet)
// ─────────────────────────────────────────────────────────

function SplashScreen({ onLoginNavigate, onSkip }: { onLoginNavigate: () => void; onSkip: () => void; }) {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashLogoContainer}>
        <View style={styles.splashLogoCircle}>
          <Text style={{ fontSize: 60 }}>🏆</Text>
        </View>
        <Text style={styles.splashTitle}>스포바이저</Text>
        <Text style={styles.splashDesc}>
          경기장 여행의 시작,{"\n"}최적 코스를 한 번에
        </Text>
      </View>

      <View style={styles.splashBtnContainer}>
        <TouchableOpacity style={styles.splashPrimaryBtn} onPress={onLoginNavigate}>
          <Text style={styles.splashPrimaryBtnText}>스포바이저 ID로 로그인하기</Text>
        </TouchableOpacity>
        
        <View style={styles.splashSnsBox}>
          <Text style={styles.splashSnsTitle}>SNS 간편 로그인</Text>
          <View style={styles.splashSnsBtnRow}>
            <TouchableOpacity style={styles.splashKakaoBtn} onPress={onSkip}>
              <Text style={styles.splashKakaoText}>카카오</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.splashGoogleBtn} onPress={onSkip}>
              <Text style={styles.splashGoogleText}>Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.splashPreviewBtn} onPress={onSkip}>
        <Text style={styles.splashPreviewText}>
          스포바이저 미리보기 <Text style={styles.splashPreviewTextHighlight}>→ 체험하기</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function IDLoginScreen({ onBack, onLoginSuccess }: { onBack: () => void; onLoginSuccess: () => void; }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  return (
    <View style={styles.loginContainer}>
      <TouchableOpacity style={styles.loginBackBtn} onPress={onBack}>
        <ArrowLeft size={18} color="#9CA3AF" />
        <Text style={styles.loginBackText}>뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.loginTitle}>로그인</Text>
      <Text style={styles.loginDesc}>스포바이저 계정으로 로그인해주세요</Text>
      
      <TextInput 
        style={styles.loginInput}
        placeholder="아이디" 
        value={id} 
        onChangeText={setId} 
        placeholderTextColor="#9CA3AF"
      />
      <TextInput 
        style={[styles.loginInput, { marginBottom: 32 }]}
        placeholder="비밀번호" 
        secureTextEntry 
        value={pw} 
        onChangeText={setPw} 
        placeholderTextColor="#9CA3AF"
      />
      
      <TouchableOpacity style={styles.loginSubmitBtn} onPress={onLoginSuccess}>
        <Text style={styles.loginSubmitText}>로그인</Text>
      </TouchableOpacity>
      
      <View style={styles.loginLinksRow}>
        <TouchableOpacity><Text style={styles.loginLinkText}>비밀번호 찾기</Text></TouchableOpacity>
        <Text style={styles.loginLinkDivider}>|</Text>
        <TouchableOpacity><Text style={styles.loginLinkHighlight}>회원가입</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Step Indicator Component
// ─────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <View style={stepStyles.container}>
      {[1, 2, 3, 4, 5].map((step) => {
        const isDone = step < current;
        const isCurrent = step === current;
        return (
          <React.Fragment key={step}>
            <View style={[stepStyles.circle, isDone && stepStyles.doneCircle, isCurrent && stepStyles.activeCircle, !isDone && !isCurrent && stepStyles.inactiveCircle]}>
              {isDone ? <Check size={12} color="#FFF" strokeWidth={3} /> : <Text style={[stepStyles.circleText, (isCurrent || isDone) && stepStyles.activeText]}>{step}</Text>}
            </View>
            {step < 5 && <View style={[stepStyles.line, isDone ? stepStyles.activeLine : stepStyles.inactiveLine]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  circle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  activeCircle: { backgroundColor: '#5B44E8' },
  doneCircle: { backgroundColor: '#5B44E8' },
  inactiveCircle: { backgroundColor: '#E2E8F0' },
  circleText: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF' },
  activeText: { color: '#FFFFFF' },
  line: { width: 16, height: 2, marginHorizontal: 4 },
  activeLine: { backgroundColor: '#5B44E8' },
  inactiveLine: { backgroundColor: '#E2E8F0' },
});

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function MainApp({ onLogout, initialUser }: { onLogout: () => void; initialUser: UserProfile }) {
  const [tab, setTab] = useState<TabType>('home');
  const [flow, setFlow] = useState<FlowStep>('home');
  const [profile, setProfile] = useState<UserProfile>(initialUser);
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [tripList, setTripList] = useState<Trip[]>([]);
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<FavoritePlace[]>([]);
  const [favoriteTeamSaving, setFavoriteTeamSaving] = useState(false);
  const [myPageSection, setMyPageSection] = useState<MyPageSection>('menu');
  const [favoriteTeamModalOpen, setFavoriteTeamModalOpen] = useState(false);
  const [favoriteTeamDropdownOpen, setFavoriteTeamDropdownOpen] = useState(false);
  const [favoriteTeamDraftSport, setFavoriteTeamDraftSport] = useState<Sport>('baseball');
  const [favoriteTeamDraftName, setFavoriteTeamDraftName] = useState('');
  const [favoriteTeamDraftNickname, setFavoriteTeamDraftNickname] = useState('');
  const [accountNicknameDraft, setAccountNicknameDraft] = useState(initialUser.nickname);
  const [accountCurrentPassword, setAccountCurrentPassword] = useState('');
  const [accountNewPassword, setAccountNewPassword] = useState('');
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(initialUser.nickname);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPasswordDraft, setCurrentPasswordDraft] = useState('');
  const [newPasswordDraft, setNewPasswordDraft] = useState('');
  const [origin, setOrigin] = useState('');
  const [originCoordinates, setOriginCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState<string>(() => { const now = new Date(); return dateKey(now.getFullYear(), now.getMonth(), now.getDate()); });
  const [selectedGame, setSelectedGame] = useState<Game | null>(GAMES[1]);
  const [gameViewMode, setGameViewMode] = useState<'all' | 'favorites'>('all');

  // Form State
  const [selectedGameDate, setSelectedGameDate] = useState<string>(GAMES[1].date);
  const [startTime, setStartTime] = useState<string>(GAMES[1].time);
  const [arrivalTime, setArrivalTime] = useState<string>('1시간 전');
  const [tripTiming, setTripTiming] = useState<string>('경기 전');

  const [transport, setTransport] = useState<string[]>(['대중교통']);
  const [maxTime, setMaxTime] = useState<string>('1시간');
  const [walkDist, setWalkDist] = useState<string>('20분 이내');

  const [companion, setCompanion] = useState<string>('혼로여행');
  const [extraCompanion, setExtraCompanion] = useState<string[]>([]);

  const [concept, setConcept] = useState<string | null>('미식 탐방형');
  const [useCustomRatio, setUseCustomRatio] = useState(false);
  const [customRatios, setCustomRatios] = useState({ 맛집: '25', 관광지: '25', 자연: '25', 쇼핑: '25' });
  const [extras, setExtras] = useState<string[]>(['실내 선호', '혼잡 피하기', '페이링 가능']);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<SpotSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [fixedPlaces, setFixedPlaces] = useState<SpotSearchResult[]>([]);
  const [excludePlaceQuery, setExcludePlaceQuery] = useState('');
  const [excludePlaceResults, setExcludePlaceResults] = useState<SpotSearchResult[]>([]);
  const [isSearchingExcludePlaces, setIsSearchingExcludePlaces] = useState(false);
  const [excludedPlaces, setExcludedPlaces] = useState<SpotSearchResult[]>([]);
  const [originQuery, setOriginQuery] = useState('');
  const [originResults, setOriginResults] = useState<SpotSearchResult[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [favoritePlaceLabel, setFavoritePlaceLabel] = useState('');
  const [originSource, setOriginSource] = useState<'gps' | 'search' | null>(null);

  // Course States
  // AI 모델 연동 전까지는 추천 결과를 비워둡니다.
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course>(MOCK_COURSES[0]);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(1);
  const [selectedPreset, setSelectedPreset] = useState<PresetCourse>(PRESET_COURSES[0]);

  // Modals & Feedback
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [selectedModalOption, setSelectedModalOption] = useState<string | null>(null);
  const [starRating, setStarRating] = useState<number>(3);
  const [visitedSpotIds, setVisitedSpotIds] = useState<number[]>([102, 103, 105]);

  // Mascot Customization
  const [selectedMascot, setSelectedMascot] = useState<MascotOption>(() => MASCOTS.find((item) => item.id === initialUser.mascot) ?? MASCOTS[0]);
  const [selectedBgColor, setSelectedBgColor] = useState<ColorOption>(() => COLOR_OPTIONS.find((item) => item.hex.toLowerCase() === (initialUser.themeColor ?? '').toLowerCase()) ?? COLOR_OPTIONS[0]);

  // Step 5 Exclude Filter
  const [excludeFilters, setExcludeFilters] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([listSavedCourses(), listTrips(), listFavoriteTeams(), listFavoritePlaces()]).then(([saved, trips, teams, places]) => {
      setSavedCourses(saved);
      setTripList(trips);
      setFavoriteTeams(teams);
      setFavoritePlaces(places);
    }).catch(() => {
      // 첫 실행에서 빈 목록은 정상입니다.
    });
  }, []);

  useEffect(() => {
    const query = placeQuery.trim();
    if (query.length < 2) {
      setPlaceResults([]);
      setIsSearchingPlaces(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const results = await searchSpots(query);
        if (!cancelled) setPlaceResults(results);
      } catch {
        if (!cancelled) setPlaceResults([]);
      } finally {
        if (!cancelled) setIsSearchingPlaces(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placeQuery]);

  useEffect(() => {
    const query = excludePlaceQuery.trim();
    if (query.length < 2) {
      setExcludePlaceResults([]);
      setIsSearchingExcludePlaces(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingExcludePlaces(true);
      try {
        const results = await searchSpots(query);
        if (!cancelled) setExcludePlaceResults(results);
      } catch { if (!cancelled) setExcludePlaceResults([]); }
      finally { if (!cancelled) setIsSearchingExcludePlaces(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [excludePlaceQuery]);

  useEffect(() => {
    const query = originQuery.trim();
    if (query.length < 2) {
      setOriginResults([]);
      setIsSearchingOrigin(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      try {
        const results = await searchSpots(query);
        if (!cancelled) setOriginResults(results);
      } catch { if (!cancelled) setOriginResults([]); }
      finally { if (!cancelled) setIsSearchingOrigin(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [originQuery]);

  const toggleExtraCompanion = (item: string) => {
    setExtraCompanion((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleConceptExtra = (item: string) => {
    setExtras((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleExcludeFilter = (filter: string) => {
    setExcludeFilters((prev) =>
      prev.includes(filter) ? prev.filter((item) => item !== filter) : [...prev, filter]
    );
  };

  const toggleTransport = (value: string) => {
    setTransport((previous) => {
      if (previous.includes(value)) {
        return previous.length === 1 ? previous : previous.filter((item) => item !== value);
      }
      if ((value === '대중교통' && previous.includes('자차')) || (value === '자차' && previous.includes('대중교통'))) {
        Alert.alert('이동수단 선택', '대중교통과 자동차는 함께 선택할 수 없습니다.');
        return previous;
      }
      return [...previous, value];
    });
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('위치 권한 필요', '현재 위치를 출발지로 사용하려면 위치 권한을 허용해주세요.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });
      const { latitude, longitude } = position.coords;
      setOriginCoordinates({ latitude, longitude });
      setOriginSource('gps');
      setOriginQuery('');
      setOrigin(`현재 위치 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);

      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        const address = addresses[0];
        const label = [address?.district, address?.city, address?.street].filter(Boolean).join(' ');
        if (label) setOrigin(label);
      } catch {
        // 좌표만으로도 AI 서버가 출발지를 처리할 수 있으므로 주소 변환 실패는 무시합니다.
      }
    } catch {
      Alert.alert('현재 위치 확인 실패', '위치를 확인하지 못했습니다. 출발지를 직접 입력해주세요.');
    } finally {
      setIsLocating(false);
    }
  };

  const addFixedPlace = (place: SpotSearchResult) => {
    if (fixedPlaces.some((item) => item.contentId === place.contentId)) return;
    setFixedPlaces((previous) => [...previous, place]);
    setPlaceQuery('');
    setPlaceResults([]);
  };

  const addExcludedPlace = (place: SpotSearchResult) => {
    if (excludedPlaces.some((item) => item.contentId === place.contentId)) return;
    setExcludedPlaces((previous) => [...previous, place]);
    setExcludePlaceQuery('');
    setExcludePlaceResults([]);
  };

  const selectOriginPlace = (place: SpotSearchResult) => {
    if (place.latitude == null || place.longitude == null) return;
    setOrigin(place.roadAddress || place.address || place.name);
    setOriginCoordinates({ latitude: place.latitude, longitude: place.longitude });
    setOriginSource('search');
    setOriginQuery('');
    setOriginResults([]);
  };

  const toggleFavoriteTeam = (sport: Sport, teamName: string) => {
    setFavoriteTeams((previous) => previous.some((team) => team.sport === sport && team.teamName === teamName)
      ? previous.filter((team) => !(team.sport === sport && team.teamName === teamName))
      : [...previous, { sport, teamName }]);
  };

  const saveFavoriteTeams = async () => {
    setFavoriteTeamSaving(true);
    try {
      const saved = await replaceFavoriteTeams(favoriteTeams);
      setFavoriteTeams(saved);
      Alert.alert('저장 완료', '관심 구단을 저장했습니다.');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '관심 구단을 저장하지 못했습니다.');
    } finally { setFavoriteTeamSaving(false); }
  };

  const saveFavoriteTeamDraft = async () => {
    if (!favoriteTeamDraftName) {
      Alert.alert('구단 선택 필요', '관심 구단을 선택해주세요.');
      return;
    }
    if (favoriteTeams.some((team) => team.sport === favoriteTeamDraftSport && team.teamName === favoriteTeamDraftName)) {
      Alert.alert('이미 등록된 구단', '같은 구단은 중복해서 등록할 수 없습니다.');
      return;
    }
    if (favoriteTeams.filter((team) => team.sport === favoriteTeamDraftSport).length >= 3) {
      Alert.alert('등록 한도 초과', '종목당 관심 구단은 최대 3개까지 등록할 수 있습니다.');
      return;
    }
    setFavoriteTeamSaving(true);
    try {
      const saved = await replaceFavoriteTeams([
        ...favoriteTeams,
        { sport: favoriteTeamDraftSport, teamName: favoriteTeamDraftName, nickname: favoriteTeamDraftNickname.trim() || null },
      ]);
      setFavoriteTeams(saved);
      setFavoriteTeamDraftName('');
      setFavoriteTeamDraftNickname('');
      setFavoriteTeamModalOpen(false);
      Alert.alert('저장 완료', '관심 구단을 저장했습니다.');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '관심 구단을 저장하지 못했습니다.');
    } finally {
      setFavoriteTeamSaving(false);
    }
  };

  const saveCurrentOriginAsFavorite = async () => {
    if (!originCoordinates || !origin.trim()) {
      Alert.alert('출발지 선택 필요', '먼저 현재 위치 또는 검색 결과에서 출발지를 선택해주세요.');
      return;
    }
    try {
      const place = await addFavoritePlace({
        label: favoritePlaceLabel.trim() || '자주 가는 장소',
        name: origin,
        address: origin,
        longitude: originCoordinates.longitude,
        latitude: originCoordinates.latitude,
      });
      setFavoritePlaces((previous) => [place, ...previous]);
      setFavoritePlaceLabel('');
      Alert.alert('저장 완료', '자주 가는 장소로 저장했습니다.');
    } catch (error) {
      Alert.alert('장소 저장 실패', error instanceof Error ? error.message : '장소를 저장하지 못했습니다.');
    }
  };

  const toggleVisitSpot = (spotId: number) => {
    setVisitedSpotIds((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]
    );
  };

  const buildSurvey = () => ({
    '경기장': aiStadiumName(selectedGame?.stadium ?? '수원 KT위즈파크'),
    '여행_방식': tripTiming,
    '이동방식': transport.includes('자차') ? '자차+도보' : transport.includes('대중교통') ? '대중교통+도보' : '도보 단독',
    '최대이동시간': maxTime,
    '걷는거리': walkDist.replace('이하', '이내'),
    '동행': companion,
    '추가동행': extraCompanion,
    '컨셉': concept ?? '미식 탐방형',
    '추가조건': extras,
    '고정핀': fixedPlaces.map((place) => place.name),
    '제외장소': excludedPlaces.map((place) => place.name),
    '제외조건': excludeFilters,
    '커스텀비율': useCustomRatio
      ? Object.fromEntries(Object.entries(customRatios).map(([key, value]) => [key, Number(value) || 0]))
      : null,
  });

  const daysInCalendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstDayOfCalendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const calendarGames = useMemo(() => GAMES.filter((game) => game.date === selectedDate), [selectedDate]);
  const visibleGames = useMemo(() => {
    if (gameViewMode === 'all') return calendarGames;
    if (favoriteTeams.length === 0) return [];
    const names = new Set(favoriteTeams.map((team) => team.teamName));
    return calendarGames.filter((game) => names.has(game.home) || names.has(game.away));
  }, [calendarGames, favoriteTeams, gameViewMode]);
  const previewConcept = concept ?? '미식 탐방형';
  const customRatioTotal = Object.values(customRatios).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const accountHasChanges = accountNicknameDraft.trim() !== profile.nickname || accountCurrentPassword.length > 0 || accountNewPassword.length > 0;

  const handleCreateCourseRequest = async () => {
    setIsSubmitting(true);
    try {
      const survey = buildSurvey();
      await saveUserSurvey(survey);
      await createRecommendationRequest(survey);
      setCourses([]);
      setFlow('courseList');
    } catch (error) {
      Alert.alert('설문 저장 실패', error instanceof Error ? error.message : '설문을 저장하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCurrentCourse = async () => {
    setIsSubmitting(true);
    try {
      const saved = await saveCourse({ title: selectedCourse.title, stadium: selectedGame?.stadium, courseType: selectedCourse.conceptTag, course: selectedCourse });
      setSavedCourses((previous) => [saved, ...previous]);
      Alert.alert('저장 완료', '코스를 저장했습니다.');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '코스를 저장하지 못했습니다.');
    } finally { setIsSubmitting(false); }
  };

  const handleConfirmTrip = async () => {
    setIsSubmitting(true);
    try {
      const trip = await createTrip({
        stadium: selectedGame?.stadium ?? '수원 KT위즈파크',
        matchName: selectedGame ? `${selectedGame.home} vs ${selectedGame.away}` : undefined,
        tripDate: selectedGame?.date,
        courseTitle: selectedCourse.title,
      });
      setCurrentTripId(trip.id);
      setTripList((previous) => [trip, ...previous]);
      setFlow('feedbackReview');
    } catch (error) {
      Alert.alert('여행 기록 실패', error instanceof Error ? error.message : '여행 기록을 저장하지 못했습니다.');
    } finally { setIsSubmitting(false); }
  };

  const handleSubmitFeedback = async () => {
    if (!currentTripId) { setFlow('feedbackDone'); return; }
    setIsSubmitting(true);
    try {
      const updated = await submitTripFeedback(currentTripId, starRating, visitedSpotIds);
      setTripList((previous) => previous.map((trip) => trip.id === updated.id ? updated : trip));
      setFlow('feedbackDone');
    } catch (error) {
      Alert.alert('피드백 실패', error instanceof Error ? error.message : '피드백을 저장하지 못했습니다.');
    } finally { setIsSubmitting(false); }
  };

  const handleProfileSave = async (changes: { nickname?: string; mascot?: string; themeColor?: string }, onSuccess?: () => void) => {
    setIsSubmitting(true);
    try {
      const updated = await updateMyProfile(changes);
      setProfile(updated);
      if (updated.mascot) setSelectedMascot(MASCOTS.find((item) => item.id === updated.mascot) ?? MASCOTS[0]);
      if (updated.themeColor) {
        const updatedThemeColor = updated.themeColor;
        setSelectedBgColor(COLOR_OPTIONS.find((item) => item.hex.toLowerCase() === updatedThemeColor.toLowerCase()) ?? COLOR_OPTIONS[0]);
      }
      await saveAuthSession({ ...updated, accessToken: initialUser.accessToken });
      setIsNicknameModalOpen(false);
      setIsPasswordModalOpen(false);
      onSuccess?.();
    } catch (error) {
      Alert.alert('프로필 수정 실패', error instanceof Error ? error.message : '프로필을 수정하지 못했습니다.');
    } finally { setIsSubmitting(false); }
  };

  const handleAccountSave = async () => {
    const nickname = accountNicknameDraft.trim();
    if (!nickname) {
      Alert.alert('닉네임 확인', '닉네임을 입력해주세요.');
      return;
    }
    const hasPasswordChange = accountCurrentPassword.length > 0 || accountNewPassword.length > 0;
    if (hasPasswordChange && (!accountCurrentPassword || accountNewPassword.length < 8)) {
      Alert.alert('비밀번호 확인', '현재 비밀번호를 입력하고 새 비밀번호는 8자 이상 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      let updated = profile;
      if (nickname !== profile.nickname) {
        updated = await updateMyProfile({ nickname });
        setProfile(updated);
        await saveAuthSession({ ...updated, accessToken: initialUser.accessToken });
      }
      if (hasPasswordChange) {
        await changePassword(accountCurrentPassword, accountNewPassword);
        setAccountCurrentPassword('');
        setAccountNewPassword('');
      }
      setAccountNicknameDraft(updated.nickname);
      Alert.alert('저장 완료', '계정 정보를 저장했습니다.');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '계정 정보를 저장하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSave = async () => {
    if (newPasswordDraft.length < 8) { Alert.alert('비밀번호 확인', '새 비밀번호는 8자 이상이어야 합니다.'); return; }
    setIsSubmitting(true);
    try {
      await changePassword(currentPasswordDraft, newPasswordDraft);
      setCurrentPasswordDraft(''); setNewPasswordDraft(''); setIsPasswordModalOpen(false);
      Alert.alert('변경 완료', '비밀번호를 변경했습니다.');
    } catch (error) {
      Alert.alert('변경 실패', error instanceof Error ? error.message : '비밀번호를 변경하지 못했습니다.');
    } finally { setIsSubmitting(false); }
  };

  const handleConceptNext = () => {
    if (useCustomRatio && customRatioTotal !== 100) {
      Alert.alert('비율 확인', customRatioTotal < 100
        ? '전체 비율의 합계가 100보다 작습니다. 정확히 100이 되도록 설정해주세요.'
        : '전체 비율의 합계가 100을 초과했습니다. 정확히 100이 되도록 설정해주세요.');
      return;
    }
    setFlow('places');
  };

  const handleCreateCourseFromPlaces = () => {
    if (useCustomRatio && customRatioTotal !== 100) {
      Alert.alert('비율 확인', '직접 설정한 비율의 합계가 정확히 100이어야 코스를 만들 수 있습니다.');
      return;
    }
    handleCreateCourseRequest();
  };

  const handleDeleteAccount = () => {
    Alert.alert('회원탈퇴', '계정과 저장된 데이터를 모두 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try { await deleteMyAccount(); await clearAuthSession(); onLogout(); }
        catch (error) { Alert.alert('탈퇴 실패', error instanceof Error ? error.message : '계정을 삭제하지 못했습니다.'); }
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.flex1}>
      <View style={styles.flex1}>
        {/* ========================================================= */}
        {/* TAB 1: 홈 (경기 선택 & 코스 생성 Flow) */}
        {/* ========================================================= */}
        {tab === 'home' && (
          <>
            {/* 1. 홈 메인 */}
            {flow === 'home' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowCenter}>
                      <Text style={{ fontSize: 20 }}>🏆</Text>
                      <Text style={styles.headerTitle}>스포바이저</Text>
                    </View>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => { setMyPageSection('menu'); setTab('my'); }}>
                      <User size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.headerSub}>어떤 경기 보러 가세요?</Text>
                  <Text style={styles.headerDesc}>날짜를 선택하면 경기 일정을 보여드려요</Text>

                  {/* 달력 */}
                  <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity style={styles.calNavBtn} onPress={() => setCalendarMonth((month) => { const next = new Date(month.getFullYear(), month.getMonth() - 1, 1); setSelectedDate(dateKey(next.getFullYear(), next.getMonth(), 1)); setGameViewMode('all'); return next; })}><ChevronLeft size={16} color="#6B7280" /></TouchableOpacity>
                      <Text style={styles.calendarMonthText}>{calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월</Text>
                      <TouchableOpacity style={styles.calNavBtn} onPress={() => setCalendarMonth((month) => { const next = new Date(month.getFullYear(), month.getMonth() + 1, 1); setSelectedDate(dateKey(next.getFullYear(), next.getMonth(), 1)); setGameViewMode('all'); return next; })}><ChevronRight size={16} color="#6B7280" /></TouchableOpacity>
                    </View>

                    <View style={styles.weekRow}>
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                        <Text key={day} style={[styles.weekText, idx === 0 && { color: '#EF4444' }, idx === 6 && { color: '#3B82F6' }]}>{day}</Text>
                      ))}
                    </View>

                    <View style={styles.daysGrid}>
                      {Array.from({ length: firstDayOfCalendarMonth }, (_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
                      {Array.from({ length: daysInCalendarMonth }, (_, i) => i + 1).map((day) => {
                        const dayKey = dateKey(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                        const isSelected = selectedDate === dayKey;
                        const isToday = dayKey === currentDateKey;
                        return (
                          <TouchableOpacity key={day} style={styles.dayCell} onPress={() => { setSelectedDate(dayKey); setGameViewMode('all'); }}>
                            <View style={[styles.dayCircle, isToday && styles.todayDayCircle, isSelected && styles.selectedDayCircle]}>
                              <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20 }}>
                  <View style={styles.rowCenter}>
                    <Text style={styles.sectionTitle}>{selectedDate.replace(/-/g, '.')} 경기 일정</Text>
                    <View style={styles.matchCountBadge}><Text style={styles.matchCountText}>{visibleGames.length}경기</Text></View>
                  </View>

                  <View style={styles.gameFilterRow}>
                    <Text style={styles.gameFilterLabel}>경기 보기</Text>
                    <View style={styles.gameFilterOptions}>
                      {([{ id: 'all', label: '전체 보기' }, { id: 'favorites', label: '내 구단 경기 보기' }] as const).map((option) => (
                        <TouchableOpacity key={option.id} onPress={() => setGameViewMode(option.id)} style={[styles.gameFilterOption, gameViewMode === option.id && styles.gameFilterOptionActive]}>
                          <Text style={[styles.gameFilterOptionText, gameViewMode === option.id && styles.gameFilterOptionTextActive]}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {gameViewMode === 'favorites' && favoriteTeams.length === 0 && <Text style={styles.emptyListText}>설정한 관심 구단이 없습니다.</Text>}
                  {visibleGames.length === 0 && !(gameViewMode === 'favorites' && favoriteTeams.length === 0) && <Text style={styles.emptyListText}>해당 날짜에 경기가 없습니다.</Text>}
                  {visibleGames.map((game) => (
                    <TouchableOpacity key={game.id} style={styles.gameCard} onPress={() => { setSelectedGame(game); setSelectedGameDate(game.date); setStartTime(game.time); setFlow('gameInfo'); }}>
                      <View style={styles.rowBetween}>
                        <View style={styles.sportBadge}><Text style={styles.sportBadgeText}>{game.sport === 'baseball' ? '⚾ 야구' : game.sport === 'soccer' ? '⚽ 축구' : '🏐 배구'}</Text></View>
                        <View style={styles.rowCenter}><Clock size={12} color="#6B7280" /><Text style={{ fontSize: 12, color: '#6B7280' }}>{game.time}</Text></View>
                      </View>
                      <View style={styles.matchRow}>
                        <View style={{ alignItems: 'center' }}>
                          <View style={[styles.emojiCircle, { borderColor: '#FCA5A5', borderWidth: 2 }]}>
                            <Text style={{ fontSize: 22 }}>{game.homeEmoji}</Text>
                          </View>
                          <Text style={styles.teamText}>{game.home}</Text>
                          <Text style={styles.teamSub}>홈</Text>
                        </View>
                        <Text style={styles.vsText}>VS</Text>
                        <View style={{ alignItems: 'center' }}>
                          <View style={styles.emojiCircle}><Text style={{ fontSize: 22 }}>🐻</Text></View>
                          <Text style={styles.teamText}>{game.away}</Text>
                          <Text style={styles.teamSub}>원정</Text>
                        </View>
                      </View>
                      <View style={styles.rowBetween}>
                        <View style={styles.rowCenter}><Navigation size={12} color="#6B7280" /><Text style={{ fontSize: 12, color: '#6B7280' }}>{game.stadium}</Text></View>
                        <View style={styles.rowCenter}><Text style={{ fontSize: 12, fontWeight: 'bold', color: '#5B44E8' }}>코스 보기</Text><ChevronRight size={13} color="#5B44E8" /></View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 1단계: 경기 정보 */}
            {flow === 'gameInfo' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('home')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <StepIndicator current={1} />
                  <Text style={styles.headerSub}>경기 정보를 입력해주세요</Text>
                  <Text style={styles.headerDesc}>경기 시간을 기준으로 여행 코스를 만들어요.</Text>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16 }}>
                  <Text style={styles.inputLabel}>경기장</Text>
                  <View style={styles.readOnlyInput}>
                    <Navigation size={15} color="#5B44E8" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0E1A' }}>{selectedGame?.stadium || '잠실야구장'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>경기 날짜</Text>
                  <View style={styles.readOnlyInput}>
                    <CalendarIcon size={18} color="#5B44E8" />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#0F0E1A' }}>{dateLabel(selectedGame?.date ?? selectedGameDate)}</Text>
                  </View>

                  <Text style={styles.inputLabel}>경기 시작 시간</Text>
                  <View style={styles.readOnlyInput}>
                    <Clock size={15} color="#5B44E8" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F0E1A' }}>{selectedGame?.time ?? startTime}</Text>
                  </View>

                  <Text style={styles.inputLabel}>경기장 도착 희망 시간</Text>
                  <View style={styles.chipGrid}>
                    {['30분 전', '1시간 전', '1시간 30분 전', '2시간 전', '직전 입장', '여유 있게'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setArrivalTime(t)} style={[styles.chipBtn, arrivalTime === t && styles.chipActive]}>
                        <Text style={[styles.chipText, arrivalTime === t && styles.chipActiveText]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>여행 방식</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['경기 전', '경기 후', '전후 모두'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setTripTiming(t)} style={[styles.outlineBtn, tripTiming === t && styles.outlineBtnActive]}>
                        <Text style={[styles.outlineBtnText, tripTiming === t && styles.outlineBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('transport')}><Text style={styles.purpleBtnText}>다음</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {/* 2단계: 이동 조건 */}
            {flow === 'transport' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('gameInfo')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <StepIndicator current={2} />
                  <Text style={styles.headerSub}>이동 조건을 알려주세요</Text>
                  <Text style={styles.headerDesc}>출발지와 이동 방식을 알려주시면 최적 코스를 찾아드려요.</Text>
                </View>
                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16 }}>
                  <Text style={styles.inputLabel}>출발지</Text>
                  <View style={styles.readOnlyInput}>
                    <Navigation size={15} color="#5B44E8" />
                    <TextInput value={originQuery} onChangeText={(value) => { setOriginQuery(value); setOrigin(''); setOriginCoordinates(null); setOriginSource(null); }} style={{ flex: 1, fontSize: 14 }} placeholder="출발지 주소나 장소를 검색하세요" />
                  </View>

                  {isSearchingOrigin && <ActivityIndicator color="#5B44E8" />}
                  {originResults.length > 0 && <View style={styles.placeResultsBox}>
                    {originResults.map((place) => <TouchableOpacity key={place.contentId} style={styles.placeResultRow} onPress={() => selectOriginPlace(place)}>
                      <View style={styles.placeResultIcon}><MapIcon size={14} color="#5B44E8" /></View>
                      <View style={{ flex: 1 }}><Text style={{ fontWeight: '800', fontSize: 13 }}>{place.name}</Text><Text style={styles.placeResultMeta}>{place.roadAddress || place.address || '네이버 장소 검색 결과'}</Text></View>
                      <Text style={styles.placeSelectText}>선택</Text>
                    </TouchableOpacity>)}
                  </View>}

                  {Boolean(origin) && <View style={styles.originSelectedCard}><Check size={14} color="#059669" /><Text style={{ flex: 1, fontSize: 12, color: '#047857', fontWeight: '700' }}>{origin}</Text></View>}

                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <TouchableOpacity style={[styles.locationActionBtn, isLocating && { opacity: 0.6 }]} onPress={handleUseCurrentLocation} disabled={isLocating}>
                      {isLocating ? <ActivityIndicator size="small" color="#5B44E8" /> : <Navigation size={14} color="#5B44E8" />}
                      <Text style={styles.locationActionText}>{isLocating ? '위치 확인 중...' : '현재 위치 사용'}</Text>
                    </TouchableOpacity>
                    {originSource === 'gps' && <View style={styles.locationVerified}><Check size={13} color="#059669" /><Text style={styles.locationVerifiedText}>GPS 위치 선택됨</Text></View>}
                  </View>

                  {favoritePlaces.length > 0 && <View style={styles.favoritePlacesBox}>
                    <Text style={styles.favoritePlacesTitle}>자주 가는 장소</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {favoritePlaces.map((place) => <View key={place.id} style={styles.favoritePlaceChipRow}>
                        <TouchableOpacity onPress={() => selectOriginPlace({ contentId: `favorite-${place.id}`, name: place.name, address: place.address, roadAddress: place.roadAddress, longitude: place.longitude, latitude: place.latitude })} style={styles.favoritePlaceChip}><Text style={styles.favoritePlaceChipText}>{place.label}</Text><Text style={styles.favoritePlaceName}>{place.name}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={async () => { try { await deleteFavoritePlace(place.id); setFavoritePlaces((previous) => previous.filter((item) => item.id !== place.id)); } catch (error) { Alert.alert('삭제 실패', error instanceof Error ? error.message : '장소를 삭제하지 못했습니다.'); } }}><X size={12} color="#6B7280" /></TouchableOpacity>
                      </View>)}
                    </View>
                  </View>}
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TextInput value={favoritePlaceLabel} onChangeText={setFavoritePlaceLabel} style={[styles.favoriteLabelInput, { flex: 1 }]} placeholder="등록 이름 (예: 집)" />
                    <TouchableOpacity style={styles.favoriteSaveBtn} onPress={saveCurrentOriginAsFavorite}><Text style={styles.favoriteSaveBtnText}>자주 가는 장소 저장</Text></TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>이동수단 (복수 선택 가능)</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['대중교통', '자차', '도보'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => toggleTransport(t)} style={[styles.outlineBtn, transport.includes(t) && styles.outlineBtnActive]}>
                        <Text style={[styles.outlineBtnText, transport.includes(t) && styles.outlineBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {transport.includes('대중교통') && transport.includes('자차') && <Text style={styles.transportErrorText}>대중교통과 자동차는 함께 선택할 수 없습니다.</Text>}

                  <Text style={styles.inputLabel}>최대 이동 가능 시간</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['30분', '1시간', '1시간 30분', '2시간', '3시간'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setMaxTime(t)} style={[styles.outlineBtn, maxTime === t && styles.outlineBtnActive]}>
                        <Text style={[styles.outlineBtnText, maxTime === t && styles.outlineBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>걷는 거리</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['10분 이내', '20분 이내', '30분 이내', '상관없음'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setWalkDist(t)} style={[styles.outlineBtn, walkDist === t && styles.outlineBtnActive]}>
                        <Text style={[styles.outlineBtnText, walkDist === t && styles.outlineBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('companion')}><Text style={styles.purpleBtnText}>다음</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {/* 3단계: 동반자 선택 */}
            {flow === 'companion' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('transport')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <StepIndicator current={3} />
                  <Text style={styles.headerSub}>누구와 함께 가시나요?</Text>
                  <Text style={styles.headerDesc}>동행자에 맞는 경로와 장소를 추천해드려요.</Text>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 12 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {[
                      { id: '혼로여행', emoji: '🧍' },
                      { id: '친구와 여행', emoji: '👫' },
                      { id: '연인과의 여행', emoji: '💑' },
                      { id: '가족여행', emoji: '👨‍👩‍👧' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setCompanion(item.id)}
                        style={[styles.companionCard, companion === item.id && styles.companionCardActive]}
                      >
                        <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                        <Text style={[styles.companionText, companion === item.id && { color: '#5B44E8' }]}>{item.id}</Text>
                        {companion === item.id && (
                          <View style={styles.checkCircle}>
                            <Check size={10} color="#FFF" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>추가로 고려할 동행이 있나요?</Text>

                  {[
                    { title: '영유아 동반', desc: '유모차, 수유실, 놀이공간 고려', emoji: '👶' },
                    { title: '고령자 동반', desc: '엘리베이터, 쉼터, 경사로 우선', emoji: '👴' },
                    { title: '장애인·교통약자 동반', desc: '배리어프리 경로 우선 안내', emoji: '♿' },
                    { title: '반려동물 동반', desc: '펫 프렌들리 시설 및 경로 안내', emoji: '🐾' },
                  ].map((extra) => {
                    const isSelected = extraCompanion.includes(extra.title);
                    return (
                      <TouchableOpacity key={extra.title} style={styles.extraRow} onPress={() => toggleExtraCompanion(extra.title)}>
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{extra.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '700', fontSize: 14 }}>{extra.title}</Text>
                          <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{extra.desc}</Text>
                        </View>
                        <View style={[styles.radioEmpty, isSelected && { borderColor: '#5B44E8', backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }]}>
                          {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B44E8' }} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('concept')}><Text style={styles.purpleBtnText}>다음</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {/* 4단계: 여행 컨셉 */}
            {flow === 'concept' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('companion')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <StepIndicator current={4} />
                  <Text style={styles.headerSub}>이번 여행 컨셉은?</Text>
                  <Text style={styles.headerDesc}>추천 컨셉을 선택하거나 맛집·관광지·자연·쇼핑 비율을 직접 정해보세요.</Text>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 12 }}>
                  {[
                    { id: '미식 탐방형', desc: '로컬 맛집과 인기 식당 중심', emoji: '🍜', activeBg: '#FEF9C3', activeBorder: '#F59E0B' },
                    { id: '관광지 중심형', desc: '랜드마크와 대표 관광지 중심', emoji: '🗺️', activeBg: '#EEF2FF', activeBorder: '#5B44E8' },
                    { id: '로컬 힐링형', desc: '한적하고 자유로운 장소 중심', emoji: '🌿', activeBg: '#ECFDF5', activeBorder: '#10B981' },
                  ].map((item) => {
                    const active = concept === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => { setUseCustomRatio(false); setConcept(item.id); }}
                        style={[
                          styles.conceptBox,
                          active && { backgroundColor: item.activeBg, borderColor: item.activeBorder, borderWidth: 2 },
                        ]}
                      >
                        <View style={styles.conceptIconCircle}><Text style={{ fontSize: 24 }}>{item.emoji}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.conceptTitle, active && { color: item.activeBorder }]}>{item.id}</Text>
                          <Text style={styles.conceptDesc}>{item.desc}</Text>
                        </View>
                        <View style={[styles.radioOuter, active && { borderColor: item.activeBorder }]}>
                          {active && <View style={[styles.radioInner, { backgroundColor: item.activeBorder }]} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <Text style={[styles.inputLabel, { marginTop: 4 }]}>비율을 따로 정하고 싶나요?</Text>
                  <TouchableOpacity onPress={() => setUseCustomRatio((previous) => { const next = !previous; if (!next && !concept) setConcept('미식 탐방형'); return next; })} style={[styles.customRatioToggle, useCustomRatio && styles.customRatioToggleActive]}>
                    <Text style={[styles.customRatioToggleText, useCustomRatio && styles.customRatioToggleTextActive]}>직접 비율 정하기</Text>
                    <View style={[styles.radioOuter, useCustomRatio && styles.radioOuterActive]}>{useCustomRatio && <View style={[styles.radioInner, { backgroundColor: '#5B44E8' }]} />}</View>
                  </TouchableOpacity>
                  {useCustomRatio && <View style={styles.ratioInputGrid}>
                    {(['맛집', '관광지', '자연', '쇼핑'] as const).map((label) => <View key={label} style={styles.ratioInputItem}>
                      <Text style={styles.ratioInputLabel}>{label}</Text>
                      <TextInput keyboardType="number-pad" value={customRatios[label]} onChangeText={(value) => setCustomRatios((previous) => ({ ...previous, [label]: value.replace(/[^0-9]/g, '') }))} style={styles.ratioInput} maxLength={3} />
                      <Text style={styles.ratioPercent}>%</Text>
                    </View>)}
                    <Text style={[styles.ratioTotalText, customRatioTotal > 100 && styles.transportErrorText]}>현재 비율 합계: {customRatioTotal}%{customRatioTotal > 100 ? ' · 전체 비율은 100을 넘을 수 없습니다.' : ''}</Text>
                  </View>}

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>추가 조건</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['실내 선호', '혼잡 피하기', '페이링 가능'].map((chip) => {
                      const active = extras.includes(chip);
                      return (
                        <TouchableOpacity key={chip} onPress={() => toggleConceptExtra(chip)} style={[styles.pillChip, active && styles.pillChipActive]}>
                          {active && <Check size={12} color="#5B44E8" style={{ marginRight: 4 }} />}
                          <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>{chip}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.previewCard}>
                    <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: 'bold', marginBottom: 8 }}>선택된 컨셉 미리보기</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 18 }}>{useCustomRatio ? '🎛️' : CONCEPT_PREVIEWS[previewConcept].emoji}</Text>
                      <Text style={{ fontWeight: '900', fontSize: 15 }}>{useCustomRatio ? '직접 설정한 비율' : previewConcept}</Text>
                      {extras.map((e) => (
                        <View key={e} style={styles.previewTag}><Text style={{ fontSize: 10, color: '#5B44E8', fontWeight: 'bold' }}>{e}</Text></View>
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>{useCustomRatio ? '원하는 장소 유형의 비율을 기준으로 추천해요.' : CONCEPT_PREVIEWS[previewConcept].summary}</Text>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(useCustomRatio ? Object.entries(customRatios).map(([label, value]) => ({ label, value: `${value || 0}%`, color: label === '맛집' ? '#F59E0B' : label === '관광지' ? '#5B44E8' : label === '자연' ? '#10B981' : '#0EA5E9' })) : CONCEPT_PREVIEWS[previewConcept].ratios).map((ratio) => (
                        <View key={ratio.label} style={styles.ratioBox}><Text style={styles.ratioSub}>{ratio.label}</Text><Text style={[styles.ratioMain, { color: ratio.color }]}>{ratio.value}</Text></View>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={[styles.purpleBtn, useCustomRatio && customRatioTotal !== 100 && { opacity: 0.6 }]} onPress={handleConceptNext}><Text style={styles.purpleBtnText}>코스 만들기</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {/* 5단계: 꼭 넣고 싶은 장소 & 제외 조건 */}
            {flow === 'places' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('concept')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <StepIndicator current={5} />
                  <Text style={styles.headerSub}>꼭 넣고 싶은 장소가 있나요?</Text>
                  <Text style={styles.headerDesc}>특별히 들르고 싶은 곳을 추가해주세요.</Text>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16 }}>
                  <Text style={styles.inputLabel}>포함할 장소</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={styles.placeInputBox}>
                      <Coffee size={14} color="#9CA3AF" />
                      <TextInput value={placeQuery} onChangeText={setPlaceQuery} style={{ flex: 1, fontSize: 13 }} placeholder="장소명을 입력해주세요" returnKeyType="search" />
                    </View>
                  </View>

                  {isSearchingPlaces && <ActivityIndicator color="#5B44E8" />}
                  {!isSearchingPlaces && placeQuery.trim().length >= 2 && placeResults.length === 0 && <Text style={styles.placeHint}>검색 결과가 없습니다. 다른 장소명을 입력해보세요.</Text>}
                  {placeResults.length > 0 && (
                    <View style={styles.placeResultsBox}>
                      {placeResults.map((place) => (
                        <TouchableOpacity key={place.contentId} style={styles.placeResultRow} onPress={() => addFixedPlace(place)}>
                          <View style={styles.placeResultIcon}><MapIcon size={14} color="#5B44E8" /></View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '800', fontSize: 13 }}>{place.name}</Text>
                            <Text style={styles.placeResultMeta}>{place.category || '관광지'} · 검색 결과에서 선택</Text>
                          </View>
                          <Text style={styles.placeSelectText}>선택</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {fixedPlaces.length === 0 && <Text style={styles.placeHint}>장소명을 입력하면 네이버 지역검색 결과에서 선택할 수 있어요.</Text>}
                  {fixedPlaces.map((place, index) => (
                    <View key={place.contentId} style={styles.placeItemCard}>
                      <View style={[styles.numBadge, { backgroundColor: index % 2 === 0 ? '#F59E0B' : '#10B981' }]}><Text style={styles.numBadgeText}>{index + 1}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{place.name}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{place.category || '관광지'} · 추천 조건에 포함</Text>
                      </View>
                      <TouchableOpacity style={styles.closeCircle} onPress={() => setFixedPlaces((previous) => previous.filter((item) => item.contentId !== place.contentId))}><X size={12} color="#6B7280" /></TouchableOpacity>
                    </View>
                  ))}

                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 }}>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 12 }}>제외 조건</Text>
                    <Text style={styles.inputLabel}>제외하고 싶은 장소</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                      <View style={styles.placeInputBox}>
                        <MapIcon size={14} color="#9CA3AF" />
                        <TextInput value={excludePlaceQuery} onChangeText={setExcludePlaceQuery} style={{ flex: 1, fontSize: 13 }} placeholder="제외할 장소를 검색해주세요" returnKeyType="search" />
                      </View>
                    </View>
                    {isSearchingExcludePlaces && <ActivityIndicator color="#5B44E8" />}
                    {excludePlaceResults.length > 0 && <View style={styles.placeResultsBox}>{excludePlaceResults.map((place) => <TouchableOpacity key={place.contentId} style={styles.placeResultRow} onPress={() => addExcludedPlace(place)}><View style={styles.placeResultIcon}><MapIcon size={14} color="#5B44E8" /></View><View style={{ flex: 1 }}><Text style={{ fontWeight: '800', fontSize: 13 }}>{place.name}</Text><Text style={styles.placeResultMeta}>{place.roadAddress || place.address || place.category || '네이버 검색 결과'}</Text></View><Text style={styles.placeSelectText}>선택</Text></TouchableOpacity>)}</View>}
                    {excludedPlaces.map((place) => <View key={place.contentId} style={styles.placeItemCard}><View style={[styles.numBadge, { backgroundColor: '#EF4444' }]}><Text style={styles.numBadgeText}>−</Text></View><View style={{ flex: 1 }}><Text style={{ fontWeight: 'bold', fontSize: 14 }}>{place.name}</Text><Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{place.category || '장소'} · 추천에서 제외</Text></View><TouchableOpacity style={styles.closeCircle} onPress={() => setExcludedPlaces((previous) => previous.filter((item) => item.contentId !== place.contentId))}><X size={12} color="#6B7280" /></TouchableOpacity></View>)}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {['너무 먼 곳 제외', '페이링 긴 곳 제외', '야외 장소 제외'].map((filter) => {
                        const isActive = excludeFilters.includes(filter);
                        return (
                          <TouchableOpacity key={filter} onPress={() => toggleExcludeFilter(filter)} style={[styles.excludeChip, isActive && styles.excludeChipActive]}>
                            <Text style={[styles.excludeChipText, isActive && styles.excludeChipTextActive]}>{filter}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={[styles.purpleBtn, (isSubmitting || (useCustomRatio && customRatioTotal !== 100)) && { opacity: 0.6 }]} onPress={handleCreateCourseFromPlaces} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>코스 만들기</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCreateCourseFromPlaces} style={{ alignItems: 'center', marginTop: 10 }} disabled={isSubmitting}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>건너뛰기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* AI 추천 코스 결과 목록 */}
            {flow === 'courseList' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('home')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <View style={styles.aiTag}><Text style={{ color: '#5B44E8', fontSize: 11, fontWeight: 'bold' }}>✨ AI 추천 완료</Text></View>
                  <Text style={styles.headerSub}>추천 코스가 완성됐어요!</Text>
                  <Text style={styles.headerDesc}>조건에 맞는 3개의 코스 중 선택해보세요.</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>🏟️ {selectedGame ? `${selectedGame.home} vs ${selectedGame.away}` : '경기'}</Text></View>
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>📍 {origin || '출발지 미설정'}</Text></View>
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>{useCustomRatio ? '🎛️ 직접 비율' : `${CONCEPT_PREVIEWS[previewConcept].emoji} ${previewConcept}`}</Text></View>
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>👤 {companion}</Text></View>
                  </ScrollView>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16 }}>
                  {courses.length === 0 && (
                    <View style={styles.aiEmptyCard}>
                      <Text style={{ fontSize: 34 }}>✨</Text>
                      <Text style={{ fontSize: 17, fontWeight: '900', color: '#312E81', marginTop: 12 }}>AI 추천 코스를 준비 중이에요</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 19, marginTop: 8 }}>설문은 저장되었습니다. AI 모델 서버가 연결되면 이 화면에서 추천 코스 3개를 받아볼 수 있어요.</Text>
                      <TouchableOpacity style={[styles.purpleBtn, { width: '100%', marginTop: 18 }]} onPress={() => setFlow('home')}><Text style={styles.purpleBtnText}>홈으로 돌아가기</Text></TouchableOpacity>
                    </View>
                  )}
                  {courses.map((course) => {
                    const isExpanded = expandedCourseId === course.id;
                    const isA = course.code === 'A';
                    return (
                      <View key={course.id} style={[styles.recCardBox, isA && styles.recCardBoxActive]}>
                        <View style={styles.rowBetween}>
                          <View style={styles.rowCenter}>
                            <View style={[styles.badgeLetter, { backgroundColor: isA ? '#D97706' : '#5B44E8' }]}>
                              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{course.code}</Text>
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '900' }}>{course.title}</Text>
                            <View style={[styles.yellowTag, !isA && { backgroundColor: '#EEF2FF' }]}>
                              <Text style={{ color: isA ? '#D97706' : '#5B44E8', fontSize: 10, fontWeight: 'bold' }}>{course.conceptTag}</Text>
                            </View>
                          </View>
                          {isA && (
                            <View style={styles.checkedCircleOrange}>
                              <Check size={12} color="#FFF" strokeWidth={3} />
                            </View>
                          )}
                        </View>

                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginVertical: 10 }}>{course.routeText}</Text>

                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>⏱️ {course.duration}</Text>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>🚆 이동 {course.moveTime}</Text>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>📍 {course.distance}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                          {course.tags.map((t, idx) => (
                            <View key={idx} style={styles.tagPillGrey}>
                              <Text style={{ fontSize: 11 }}>{t.emoji} {t.label}</Text>
                            </View>
                          ))}
                        </View>

                        {isExpanded && (
                          <View style={styles.expandDescBox}>
                            <Text style={{ fontSize: 12, color: '#D97706', lineHeight: 18 }}>{course.description}</Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={styles.previewBtn} onPress={() => setExpandedCourseId(isExpanded ? null : course.id)}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4B5563' }}>{isExpanded ? '접기' : '미리보기'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.purpleBtn, { flex: 1, height: 42 }, isA && { backgroundColor: '#D97706' }]}
                            onPress={() => { setSelectedCourse(course); setFlow('courseDetail'); }}
                          >
                            <Text style={styles.purpleBtnText}>자세히 보기</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 코스 상세 타임라인 */}
            {flow === 'courseDetail' && (
              <View style={styles.flex1}>
                <View style={styles.purpleHeader}>
                  <TouchableOpacity onPress={() => setFlow('courseList')} style={styles.backBtn}><ArrowLeft size={18} color="#FFF" /><Text style={{ color: '#FFF', fontSize: 13 }}>뒤로</Text></TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <View style={styles.badgeLetterYellow}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>A</Text></View>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>{selectedCourse.title} · {selectedCourse.conceptTag}</Text>
                      <Text style={{ fontSize: 11, color: '#E0E7FF', marginTop: 2 }}>{selectedCourse.description}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                    <View style={styles.statBoxCard}><Text style={{ fontSize: 16 }}>⏱️</Text><Text style={styles.statBoxMain}>3시간 10분</Text><Text style={styles.statBoxSub}>총 시간</Text></View>
                    <View style={styles.statBoxCard}><Text style={{ fontSize: 16 }}>🏃</Text><Text style={styles.statBoxMain}>35분</Text><Text style={styles.statBoxSub}>이동 시간</Text></View>
                    <View style={styles.statBoxCard}><Text style={{ fontSize: 16 }}>📍</Text><Text style={styles.statBoxMain}>4곳</Text><Text style={styles.statBoxSub}>방문 장소</Text></View>
                  </View>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16 }}>
                  <Text style={styles.sectionTitle}>타임라인</Text>

                  {selectedCourse.spots.map((spot, idx) => (
                    <View key={spot.id} style={styles.timelineRow}>
                      <View style={styles.timelineLeftNode}>
                        <View style={styles.timelineEmojiCircle}><Text style={{ fontSize: 18 }}>{spot.emoji}</Text></View>
                        {idx < selectedCourse.spots.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={{ flex: 1, paddingBottom: 16 }}>
                        <View style={styles.rowCenter}>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#5B44E8' }}>{spot.time}</Text>
                          <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F0E1A', marginLeft: 6 }}>{spot.name}</Text>
                          <ChevronRight size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                        </View>
                        {spot.stayTime && <View style={styles.stayTagPill}><Text style={{ fontSize: 10, color: '#D97706', fontWeight: 'bold' }}>{spot.stayTime}</Text></View>}
                        {spot.moveText && <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>• {spot.moveText}</Text>}
                      </View>
                    </View>
                  ))}

                  <View style={styles.arrivalNoticePill}>
                    <Text style={{ fontSize: 24 }}>🎯</Text>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#312E81' }}>경기 시작 40분 전 도착 예정</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>경기 시작 17:00 · 도착 예정 16:20</Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('mapView')}><Text style={styles.purpleBtnText}>🗺️ 지도에서 보기</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.bookmarkOutlineBtn} onPress={handleSaveCurrentCourse} disabled={isSubmitting}>
                    <Bookmark size={14} color="#5B44E8" />
                    <Text style={{ color: '#5B44E8', fontWeight: 'bold', fontSize: 13 }}>코스 저장하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 지도 동선 View */}
            {flow === 'mapView' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('courseDetail')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <View style={styles.rowBetween}>
                    <Text style={styles.headerSub}>지도 동선</Text>
                    <View style={styles.greenNavTag}><View style={styles.greenDot} /><Text style={{ fontSize: 10, color: '#059669', fontWeight: 'bold' }}>경로 안내 중</Text></View>
                  </View>
                  <Text style={styles.headerDesc}>A코스 · 수원역 ➔ KT위즈파크</Text>
                </View>

                {/* 지도 시각화 Box */}
                <View style={styles.mapCanvasBox}>
                  <View style={styles.northBadge}><Text style={{ fontWeight: 'bold', fontSize: 12 }}>N</Text></View>
                  <View style={styles.scaleLine}><Text style={{ fontSize: 9, color: '#6B7280' }}>500m</Text></View>
                  <View style={[styles.mapPin, { top: 120, left: 60, backgroundColor: '#6B7280' }]}><Text style={styles.mapPinText}>1</Text></View>
                  <View style={[styles.mapPin, { top: 80, left: 130, backgroundColor: '#D97706' }]}><Text style={styles.mapPinText}>2</Text></View>
                  <View style={[styles.mapPin, { top: 40, left: 200, backgroundColor: '#10B981' }]}><Text style={styles.mapPinText}>3</Text></View>
                  <View style={[styles.mapPin, { top: 90, left: 260, backgroundColor: '#5B44E8' }]}><Text style={styles.mapPinText}>4</Text></View>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 12 }}>
                  {[
                    { num: '1', title: '수원역', desc: 'KTX · 지하철 1호선', move: '↓ 도보 15분' },
                    { num: '2', title: '로컬 맛집', desc: '영통구 로컬 한식당', move: '↓ 도보 10분' },
                    { num: '3', title: '행궁동 카페게리', desc: '팔달구 카페 · 수원 화성 근처', move: '↓ 버스 25분' },
                    { num: '4', title: '수원 KT위즈파크', desc: '팔달구 · 주차 가능', move: '' },
                  ].map((node) => (
                    <View key={node.num}>
                      <View style={styles.mapListRow}>
                        <View style={styles.mapListNum}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>{node.num}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{node.title}</Text>
                          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{node.desc}</Text>
                        </View>
                        <ChevronRight size={16} color="#9CA3AF" />
                      </View>
                      {node.move !== '' && <Text style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 36, marginVertical: 4 }}>{node.move}</Text>}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={handleConfirmTrip} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>코스 확정하기</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.changeStatusBtn} onPress={() => setIsChangeModalOpen(true)}>
                    <RotateCcw size={14} color="#5B44E8" />
                    <Text style={{ color: '#5B44E8', fontWeight: 'bold', fontSize: 13 }}>상황이 바뀌었어요</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 피드백 리뷰 */}
            {flow === 'feedbackReview' && (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('home')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 22 }}>🏟️</Text>
                    <View>
                      <Text style={styles.headerSub}>여행은 어떠셨나요?</Text>
                      <Text style={styles.headerDesc}>A코스 · KT위즈파크 · 2026.06.29</Text>
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16 }}>
                  <View style={styles.reviewStarCard}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F0E1A', marginBottom: 4 }}>전체 코스는 어떠셨나요?</Text>
                    <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>별을 터치해서 평가해주세요</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setStarRating(s)}>
                          <Star size={32} color={s <= starRating ? '#F59E0B' : '#E2E8F0'} fill={s <= starRating ? '#F59E0B' : 'transparent'} />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#F59E0B', textAlign: 'center', marginTop: 10 }}>
                      {starRating === 5 ? '최고예요!' : starRating === 4 ? '좋았어요!' : starRating === 3 ? '보통이에요' : '아쉬워요'}
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>실제로 방문한 장소</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: -10 }}>방문한 곳에 체크해주세요</Text>

                  {selectedCourse.spots.map((spot) => {
                    const isVisited = visitedSpotIds.includes(spot.id);
                    return (
                      <TouchableOpacity
                        key={spot.id}
                        onPress={() => toggleVisitSpot(spot.id)}
                        style={[styles.visitSpotCard, isVisited && styles.visitSpotCardActive]}
                      >
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{spot.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{spot.name}</Text>
                          <Text style={{ fontSize: 11, color: isVisited ? '#10B981' : '#9CA3AF', marginTop: 2 }}>
                            {isVisited ? '☑ 방문함' : '☐ 방문하지 않음'}
                          </Text>
                        </View>
                        <View style={[styles.checkCircleGreen, isVisited && { backgroundColor: '#10B981' }]}>
                          <Check size={12} color="#FFF" strokeWidth={3} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={handleSubmitFeedback} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>피드백 제출하기</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setFlow('home')} style={{ alignItems: 'center', marginTop: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>나중에 하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 피드백 완료 */}
            {flow === 'feedbackDone' && (
              <View style={[styles.flex1, { justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' }]}>
                <View style={styles.bigCheckCirclePurple}>
                  <Check size={48} color="#FFF" strokeWidth={3.5} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F0E1A', marginTop: 24 }}>피드백 감사해요!</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  소중한 의견을 바탕으로 더 좋은 코스를 추천해드릴게요. 🏆
                </Text>

                <TouchableOpacity style={[styles.purpleBtn, { width: '100%', marginTop: 36 }]} onPress={() => setFlow('home')}>
                  <Text style={styles.purpleBtnText}>홈으로 돌아가기</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 이동 코스 */}
        {/* ========================================================= */}
        {tab === 'course' && (
          <>
            {flow === 'presetCourseDetail' ? (
              /* 이동 코스 상세 화면 */
              <View style={styles.flex1}>
                <View style={styles.purpleHeader}>
                  <TouchableOpacity onPress={() => setFlow('home')} style={styles.backBtn}>
                    <ArrowLeft size={18} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 13 }}>뒤로가기</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 20 }}>🚆</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>{selectedPreset.title}</Text>
                      <Text style={{ fontSize: 12, color: '#E0E7FF', marginTop: 2 }}>{selectedPreset.routeText}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                    <View style={styles.statBoxCard}><Text style={{ fontSize: 10, color: '#E0E7FF' }}>⏱️ 소요 시간</Text><Text style={styles.statBoxMain}>{selectedPreset.time}</Text></View>
                    <View style={styles.statBoxCard}><Text style={{ fontSize: 10, color: '#E0E7FF' }}>📍 거리</Text><Text style={styles.statBoxMain}>{selectedPreset.distance}</Text></View>
                    <View style={styles.statBoxCard}><Text style={{ fontSize: 10, color: '#E0E7FF' }}>⚡ 난이도</Text><Text style={styles.statBoxMain}>{selectedPreset.difficulty}</Text></View>
                  </View>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 20 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>이동 경로</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.saveBadgeBtn}><Bookmark size={12} color="#5B44E8" /><Text style={{ fontSize: 11, color: '#5B44E8', fontWeight: 'bold' }}>저장됨</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.shareBadgeBtn}><Share2 size={12} color="#6B7280" /><Text style={{ fontSize: 11, color: '#6B7280' }}>공유</Text></TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ gap: 12 }}>
                    {selectedPreset.nodes.map((nodeName, idx) => (
                      <View key={idx} style={styles.mapListRow}>
                        <View style={[styles.mapListNum, { backgroundColor: '#5B44E8' }]}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>{idx + 1}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{nodeName}</Text>
                          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{idx === 0 ? '도보 5분' : idx === 1 ? '환승 3분' : '버스 12분'}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>주변 명소</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={styles.spotCountCard}><Coffee size={20} color="#D97706" /><Text style={{ fontWeight: 'bold', fontSize: 14, marginTop: 6 }}>카페</Text><Text style={{ fontSize: 11, color: '#6B7280' }}>12곳</Text></View>
                    <View style={styles.spotCountCard}><ShoppingBag size={20} color="#5B44E8" /><Text style={{ fontWeight: 'bold', fontSize: 14, marginTop: 6 }}>쇼핑</Text><Text style={{ fontSize: 11, color: '#6B7280' }}>8곳</Text></View>
                    <View style={styles.spotCountCard}><Camera size={20} color="#EF4444" /><Text style={{ fontWeight: 'bold', fontSize: 14, marginTop: 6 }}>포토존</Text><Text style={{ fontSize: 11, color: '#6B7280' }}>5곳</Text></View>
                  </View>
                </ScrollView>
              </View>
            ) : (
              /* 이동 코스 리스트 */
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.headerSub}>이동 코스</Text>
                    <TouchableOpacity style={styles.filterBtn}><Filter size={14} color="#5B44E8" /><Text style={{ fontSize: 12, color: '#5B44E8', fontWeight: 'bold' }}>필터</Text></TouchableOpacity>
                  </View>
                  <Text style={styles.headerDesc}>경기장별 최적 이동 경로를 선택하세요</Text>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 12 }}>
                  {PRESET_COURSES.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.presetCard} onPress={() => { setSelectedPreset(item); setFlow('presetCourseDetail'); }}>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={styles.presetIconCircle}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.rowBetween}>
                            <Text style={{ fontSize: 15, fontWeight: '900' }}>{item.title}</Text>
                            <ChevronRight size={16} color="#9CA3AF" />
                          </View>
                          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.routeText}</Text>
                          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 }}>
                            <Text style={{ fontSize: 11, color: '#6B7280' }}>⏱️ {item.time}</Text>
                            <Text style={{ fontSize: 11, color: '#6B7280' }}>📍 {item.distance}</Text>
                            <View style={[styles.diffBadge, item.difficulty === '쉬움' ? styles.diffEasy : styles.diffNormal]}>
                              <Text style={{ fontSize: 10, fontWeight: 'bold', color: item.difficulty === '쉬움' ? '#10B981' : '#D97706' }}>{item.difficulty}</Text>
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#F59E0B', marginLeft: 'auto' }}>★ {item.rating}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: '#5B44E8', marginTop: 8 }}>• {item.nodes.join(' ➔ ')}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 저장된 코스 */}
        {/* ========================================================= */}
        {tab === 'saved' && (
          <View style={styles.flex1}>
            <View style={styles.header}>
              <Text style={styles.headerSub}>저장된 코스</Text>
              <Text style={styles.headerDesc}>내가 저장한 경기장 이동 코스</Text>
            </View>

            <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 12 }}>
              <View style={styles.savedBanner}>
                <Text style={{ fontSize: 24 }}>🏆</Text>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>총 {savedCourses.length}개의 코스 저장</Text>
                  <Text style={{ fontSize: 12, color: '#E0E7FF', marginTop: 2 }}>저장한 코스를 다시 확인할 수 있어요.</Text>
                </View>
              </View>

              {savedCourses.length === 0 && <Text style={styles.emptyListText}>아직 저장한 코스가 없습니다.</Text>}
              {savedCourses.map((item) => (
                <View key={item.id} style={styles.savedCardRow}>
                  <View style={styles.savedIconCircle}><Text style={{ fontSize: 20 }}>🏆</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{item.stadium ?? '경기장'}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.title}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(item.savedAt).toLocaleDateString()}</Text>
                    <TouchableOpacity onPress={async () => {
                      try { await deleteSavedCourse(item.id); setSavedCourses((previous) => previous.filter((course) => course.id !== item.id)); }
                      catch (error) { Alert.alert('삭제 실패', error instanceof Error ? error.message : '코스를 삭제하지 못했습니다.'); }
                    }}><Heart size={18} color="#EF4444" fill="#EF4444" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MY 페이지 & 마스코드/배경 설정 */}
        {/* ========================================================= */}
        {tab === 'my' && (
          <>
            {flow === 'customizeMascot' ? (
              <View style={styles.flex1}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setFlow('home')} style={styles.backBtn}><ArrowLeft size={18} color="#0F0E1A" /><Text style={styles.backText}>뒤로</Text></TouchableOpacity>
                  <Text style={styles.headerSub}>아이콘 설정</Text>
                  <Text style={styles.headerDesc}>나만의 프로필 아이콘을 꾸며보세요.</Text>
                </View>
                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 20 }}>
                  <View style={styles.mascotPreviewBox}><View style={[styles.mascotCircleLarge, { backgroundColor: selectedBgColor.hex }]}><Text style={{ fontSize: 44 }}>{selectedMascot.emoji}</Text></View><Text style={{ fontSize: 18, fontWeight: '900', color: '#0F0E1A', marginTop: 12 }}>{profile.nickname}</Text><Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>미리보기</Text></View>
                  <Text style={styles.sectionTitle}>아이콘 선택</Text>
                  <View style={styles.mascotGrid}>{MASCOTS.map((item) => { const isSelected = selectedMascot.id === item.id; return <TouchableOpacity key={item.id} onPress={() => setSelectedMascot(item)} style={[styles.mascotGridCard, isSelected && styles.mascotGridCardActive]}><Text style={{ fontSize: 28 }}>{item.emoji}</Text><Text style={[styles.mascotGridText, isSelected && { color: '#5B44E8', fontWeight: 'bold' }]}>{item.name}</Text>{isSelected && <View style={styles.checkMiniCircle}><Check size={10} color="#FFF" strokeWidth={3} /></View>}</TouchableOpacity>; })}</View>
                  <Text style={styles.sectionTitle}>배경 색상</Text>
                  <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 4 }}>{COLOR_OPTIONS.map((color) => { const isSelected = selectedBgColor.id === color.id; return <TouchableOpacity key={color.id} onPress={() => setSelectedBgColor(color)} style={{ alignItems: 'center', gap: 4 }}><View style={[styles.colorCircle, { backgroundColor: color.hex }, isSelected && styles.colorCircleActive]}>{isSelected && <Check size={16} color="#FFF" strokeWidth={3} />}</View><Text style={{ fontSize: 11, color: isSelected ? '#5B44E8' : '#6B7280', fontWeight: isSelected ? 'bold' : 'normal' }}>{color.name}</Text></TouchableOpacity>; })}</View>
                </ScrollView>
                <View style={styles.footer}><TouchableOpacity style={styles.purpleBtn} onPress={() => handleProfileSave({ mascot: selectedMascot.id, themeColor: selectedBgColor.hex }, () => { setMyPageSection('menu'); setFlow('home'); })} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>설정하기</Text>}</TouchableOpacity></View>
              </View>
            ) : myPageSection === 'menu' ? (
              <View style={styles.flex1}>
                <View style={styles.myHeaderPurple}>
                  <View style={styles.rowBetween}><View style={styles.rowCenter}><Text style={{ fontSize: 18 }}>🏆</Text><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>스포바이저</Text></View></View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 }}><TouchableOpacity accessibilityLabel="아이콘 변경" style={[styles.avatarPurpleCircle, { backgroundColor: selectedBgColor.hex }]} onPress={() => setFlow('customizeMascot')}><Text style={{ fontSize: 28 }}>{selectedMascot.emoji}</Text><View style={styles.editBadge}><Pencil size={10} color="#FFF" /></View></TouchableOpacity><View><Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF' }}>{profile.nickname}</Text><Text style={{ fontSize: 12, color: '#E0E7FF', marginTop: 2 }}>{profile.email}</Text></View></View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}><View style={styles.myStatBox}><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>{new Set(tripList.map((trip) => trip.stadium)).size}</Text><Text style={{ fontSize: 10, color: '#E0E7FF' }}>방문 경기장</Text></View><View style={styles.myStatBox}><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>{savedCourses.length}</Text><Text style={{ fontSize: 10, color: '#E0E7FF' }}>저장 코스</Text></View><View style={styles.myStatBox}><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>{tripList.length}</Text><Text style={{ fontSize: 10, color: '#E0E7FF' }}>여행 횟수</Text></View></View>
                </View>
                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 10 }}>
                  {([{ id: 'account', label: '계정 관리', icon: '⚙️' }, { id: 'teams', label: '내 구단 설정', icon: '🏟️' }, { id: 'trips', label: '과거 여행 리스트', icon: '🗺️' }, { id: 'support', label: '고객 지원', icon: '💬' }] as const).map((item) => <TouchableOpacity key={item.id} style={styles.myMenuRow} onPress={() => { setMyPageSection(item.id); if (item.id === 'account') setAccountNicknameDraft(profile.nickname); }}><View style={styles.myMenuIcon}><Text style={{ fontSize: 18 }}>{item.icon}</Text></View><Text style={styles.myMenuLabel}>{item.label}</Text><ChevronRight size={18} color="#9CA3AF" /></TouchableOpacity>)}
                  <View style={styles.myAccountActions}><TouchableOpacity style={styles.smallAccountBtn} onPress={onLogout}><Text style={styles.smallAccountBtnText}>로그아웃</Text></TouchableOpacity><TouchableOpacity style={styles.smallAccountBtn} onPress={handleDeleteAccount}><Text style={styles.smallAccountBtnText}>회원탈퇴</Text></TouchableOpacity></View>
                </ScrollView>
              </View>
            ) : myPageSection === 'account' ? (
              <View style={styles.flex1}><View style={styles.subPageHeader}><TouchableOpacity onPress={() => setMyPageSection('menu')}><ArrowLeft size={20} color="#6B7280" /></TouchableOpacity><Text style={styles.subPageTitle}>계정 관리</Text><View style={{ width: 20 }} /></View><ScrollView style={styles.flex1} contentContainerStyle={styles.subPageContent}><View style={styles.accountAvatarPreview}><View style={[styles.accountAvatarCircle, { backgroundColor: selectedBgColor.hex }]}><Text style={{ fontSize: 42 }}>{selectedMascot.emoji}</Text></View></View><Text style={styles.accountFieldLabel}>사용자 계정</Text><TextInput value={profile.email} editable={false} style={[styles.accountInput, styles.accountInputDisabled]} /><Text style={styles.accountFieldLabel}>닉네임</Text><TextInput value={accountNicknameDraft} onChangeText={setAccountNicknameDraft} style={styles.accountInput} placeholder="닉네임" maxLength={50} /><Text style={styles.accountFieldLabel}>비밀번호 변경</Text><TextInput value={accountCurrentPassword} onChangeText={setAccountCurrentPassword} secureTextEntry style={styles.accountInput} placeholder="현재 비밀번호" /><TextInput value={accountNewPassword} onChangeText={setAccountNewPassword} secureTextEntry style={styles.accountInput} placeholder="새 비밀번호 (8자 이상)" /><View style={{ marginTop: 14 }}><TouchableOpacity style={[styles.purpleBtn, (!accountHasChanges || isSubmitting) && styles.disabledPurpleBtn]} onPress={handleAccountSave} disabled={!accountHasChanges || isSubmitting}>{isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>저장</Text>}</TouchableOpacity></View></ScrollView></View>
            ) : myPageSection === 'teams' ? (
              <View style={styles.flex1}><View style={styles.subPageHeader}><TouchableOpacity onPress={() => setMyPageSection('menu')}><ArrowLeft size={20} color="#6B7280" /></TouchableOpacity><Text style={styles.subPageTitle}>내 구단 설정</Text><View style={{ width: 20 }} /></View><ScrollView style={styles.flex1} contentContainerStyle={styles.subPageContent}><Text style={styles.subPageSectionTitle}>관심 구단 등록</Text><Text style={styles.subPageDescription}>경기 일정 별도 확인을 위해 관심 구단을 등록해주세요.{`\n`}종목당 최대 3개까지 등록할 수 있어요.</Text><View style={styles.subPageDivider} /><Text style={styles.subPageSectionTitle}>등록된 구단</Text>{favoriteTeams.length === 0 ? <View style={styles.emptyPreferenceCard}><Text style={{ fontSize: 22 }}>🏟️</Text><Text style={styles.emptyPreferenceTitle}>아직 등록된 구단이 없어요.</Text><Text style={styles.emptyPreferenceText}>관심 있는 구단을 등록해주세요.</Text></View> : favoriteTeams.map((team) => <View key={`${team.sport}-${team.teamName}`} style={styles.registeredTeamCard}><View style={{ flex: 1 }}><Text style={styles.registeredTeamName}>{team.teamName}</Text>{team.nickname ? <Text style={styles.registeredTeamNickname}>{team.nickname}</Text> : null}</View><TouchableOpacity style={styles.deleteTeamBtn} onPress={async () => { try { const saved = await replaceFavoriteTeams(favoriteTeams.filter((item) => !(item.sport === team.sport && item.teamName === team.teamName))); setFavoriteTeams(saved); } catch (error) { Alert.alert('삭제 실패', error instanceof Error ? error.message : '구단을 삭제하지 못했습니다.'); } }}><Text style={styles.deleteTeamText}>삭제</Text></TouchableOpacity></View>)}<TouchableOpacity style={styles.purpleBtn} onPress={() => { setFavoriteTeamDraftSport('baseball'); setFavoriteTeamDraftName(''); setFavoriteTeamDraftNickname(''); setFavoriteTeamModalOpen(true); }}><Text style={styles.purpleBtnText}>+ 관심 구단 등록하기</Text></TouchableOpacity></ScrollView></View>
            ) : myPageSection === 'trips' ? (
              <View style={styles.flex1}><View style={styles.subPageHeader}><TouchableOpacity onPress={() => setMyPageSection('menu')}><ArrowLeft size={20} color="#6B7280" /></TouchableOpacity><Text style={styles.subPageTitle}>과거 여행 리스트</Text><View style={{ width: 20 }} /></View><ScrollView style={styles.flex1} contentContainerStyle={styles.subPageContent}><Text style={styles.subPageSectionTitle}>과거 여행 코스</Text><Text style={styles.subPageDescription}>여행 추천을 완료한 코스들입니다</Text>{tripList.length === 0 ? <View style={styles.emptyHistoryPanel}><Text style={styles.emptyHistoryText}>아직 코스 추천을 받지 않았어요!</Text></View> : tripList.map((trip) => <View key={trip.id} style={styles.historyCourseCard}><View style={styles.historyIcon}><Text style={{ fontSize: 20 }}>🏟️</Text></View><View style={{ flex: 1 }}><Text style={styles.historyCourseTitle}>{trip.courseTitle ?? '추천 여행 코스'}</Text><Text style={styles.historyCourseRoute}>{trip.stadium}</Text><View style={styles.historyMetaRow}><Text style={styles.historyMeta}>{trip.tripDate ?? new Date(trip.createdAt).toLocaleDateString()}</Text><Text style={styles.historyRating}>★ {trip.rating ?? '-'}</Text></View></View><ChevronRight size={18} color="#9CA3AF" /></View>)}</ScrollView></View>
            ) : (
              <View style={styles.flex1}><View style={styles.subPageHeader}><TouchableOpacity onPress={() => setMyPageSection('menu')}><ArrowLeft size={20} color="#6B7280" /></TouchableOpacity><Text style={styles.subPageTitle}>고객 지원</Text><View style={{ width: 20 }} /></View><ScrollView style={styles.flex1} contentContainerStyle={styles.subPageContent}><Text style={styles.subPageSectionTitle}>무엇을 도와드릴까요?</Text><View style={styles.supportCard}><Text style={{ fontSize: 24 }}>💬</Text><Text style={styles.supportTitle}>스포바이저 이용 안내</Text><Text style={styles.supportText}>경기 선택부터 여행 코스 생성까지 궁금한 점을 확인해보세요.</Text></View><View style={styles.supportCard}><Text style={{ fontSize: 24 }}>✉️</Text><Text style={styles.supportTitle}>문의하기</Text><Text style={styles.supportText}>서비스 이용 중 문제가 있으면 관리자에게 문의해주세요.</Text></View></ScrollView></View>
            )}
          </>
        )}
      </View>

      <Modal visible={isNicknameModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={{ fontSize: 18, fontWeight: '900' }}>닉네임 변경</Text>
            <TextInput value={nicknameDraft} onChangeText={setNicknameDraft} maxLength={50} placeholder="새 닉네임" style={styles.modalInput} />
            <TouchableOpacity style={styles.purpleBtn} onPress={() => handleProfileSave({ nickname: nicknameDraft })} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>저장</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsNicknameModalOpen(false)} style={{ alignItems: 'center', marginTop: 12 }}><Text style={{ color: '#6B7280' }}>취소</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isPasswordModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={{ fontSize: 18, fontWeight: '900' }}>비밀번호 변경</Text>
            <TextInput value={currentPasswordDraft} onChangeText={setCurrentPasswordDraft} secureTextEntry placeholder="현재 비밀번호" style={styles.modalInput} />
            <TextInput value={newPasswordDraft} onChangeText={setNewPasswordDraft} secureTextEntry placeholder="새 비밀번호 (8자 이상)" style={styles.modalInput} />
            <TouchableOpacity style={styles.purpleBtn} onPress={handlePasswordSave} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>변경하기</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)} style={{ alignItems: 'center', marginTop: 12 }}><Text style={{ color: '#6B7280' }}>취소</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={favoriteTeamModalOpen} transparent animationType="slide" onRequestClose={() => setFavoriteTeamModalOpen(false)}>
        <View style={styles.modalOverlay}><View style={styles.favoriteTeamModalContainer}><Text style={styles.modalTitle}>관심 구단 등록</Text><Text style={styles.accountFieldLabel}>종목</Text><View style={styles.sportSelectRow}>{TEAM_OPTIONS.map((item) => <TouchableOpacity key={item.sport} style={[styles.sportSelectBtn, favoriteTeamDraftSport === item.sport && styles.sportSelectBtnActive]} onPress={() => { setFavoriteTeamDraftSport(item.sport); setFavoriteTeamDraftName(''); setFavoriteTeamDropdownOpen(false); }}><Text style={[styles.sportSelectText, favoriteTeamDraftSport === item.sport && styles.sportSelectTextActive]}>{item.label}</Text></TouchableOpacity>)}</View><Text style={styles.accountFieldLabel}>구단</Text><TouchableOpacity style={styles.dropdownTrigger} onPress={() => setFavoriteTeamDropdownOpen((open) => !open)}><Text style={{ color: favoriteTeamDraftName ? '#111827' : '#9CA3AF', fontSize: 14 }}>{favoriteTeamDraftName || '구단을 선택해주세요'}</Text><ChevronDown size={18} color="#6B7280" /></TouchableOpacity>{favoriteTeamDropdownOpen && <View style={styles.dropdownMenu}>{(TEAM_OPTIONS.find((item) => item.sport === favoriteTeamDraftSport)?.teams ?? []).map((team) => <TouchableOpacity key={team} style={styles.dropdownItem} onPress={() => { setFavoriteTeamDraftName(team); setFavoriteTeamDropdownOpen(false); }}><Text style={{ color: team === favoriteTeamDraftName ? '#5B44E8' : '#374151', fontWeight: team === favoriteTeamDraftName ? '800' : '500' }}>{team}</Text></TouchableOpacity>)}</View>}<Text style={styles.accountFieldLabel}>별명</Text><TextInput value={favoriteTeamDraftNickname} onChangeText={setFavoriteTeamDraftNickname} style={styles.accountInput} placeholder="표시하고 싶은 별명을 입력해주세요" maxLength={100} /><View style={styles.modalButtonRow}><TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setFavoriteTeamModalOpen(false); setFavoriteTeamDropdownOpen(false); }}><Text style={styles.modalCancelText}>취소</Text></TouchableOpacity><TouchableOpacity style={[styles.modalSaveBtn, (!favoriteTeamDraftName || favoriteTeamSaving) && { opacity: 0.55 }]} onPress={saveFavoriteTeamDraft} disabled={!favoriteTeamDraftName || favoriteTeamSaving}>{favoriteTeamSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.purpleBtnText}>저장</Text>}</TouchableOpacity></View></View></View>
      </Modal>

      {/* "상황이 바뀌었나요?" 하단 팝업 모달 */}
      <Modal visible={isChangeModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalDragHandle} />
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F0E1A' }}>상황이 바뀌었나요?</Text>
              <TouchableOpacity onPress={() => setIsChangeModalOpen(false)} style={styles.closeCircle}>
                <X size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 16 }}>
              비나 경기 지연·취소 상황에 맞게 코스를 다시 조정할 수 있어요.
            </Text>

            {[
              { id: 'rain', title: '비가 와요', desc: '실내 중심 코스로 변경', icon: '🌂' },
              { id: 'delay', title: '경기가 지연됐어요', desc: '남은 시간 기준으로 근처 장소 추가', icon: '⏱️' },
              { id: 'cancel', title: '경기가 취소됐어요', desc: '공백 시간을 채우는 대체 관광 코스 생성', icon: '❌' },
            ].map((opt) => {
              const isSelected = selectedModalOption === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSelectedModalOption(opt.id)}
                  style={[styles.modalOptionCard, isSelected && styles.modalOptionCardActive]}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{opt.title}</Text>
                    <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.radioEmpty, isSelected && { borderColor: '#5B44E8', backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }]}>
                    {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B44E8' }} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[styles.purpleBtn, { marginTop: 16 }]} onPress={() => setIsChangeModalOpen(false)}>
              <Text style={styles.purpleBtnText}>상황을 선택해주세요</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsChangeModalOpen(false)} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 하단 네비게이션 탭 바 */}
      <View style={styles.bottomTabBar}>
        {[
          { id: 'home', label: '홈', icon: Home },
          { id: 'course', label: '코스', icon: MapIcon },
          { id: 'saved', label: '저장', icon: Bookmark },
          { id: 'my', label: 'MY', icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <TouchableOpacity
            key={id}
            style={styles.tabItem}
            onPress={() => {
              setTab(id as TabType);
              if (id === 'my') setMyPageSection('menu');
              setFlow('home');
            }}
          >
            <Icon size={20} color={tab === id ? '#5B44E8' : '#9CA3AF'} />
            <Text style={[styles.tabLabel, { color: tab === id ? '#5B44E8' : '#9CA3AF' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
// App Container (로그인 토글 상태 관리)
// ─────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthSession().then(async (session) => {
      if (!session) { router.replace('/auth'); return; }
      try {
        const profile = await getMyProfile();
        setUser({ ...session, ...profile, accessToken: session.accessToken });
      } catch {
        await clearAuthSession();
        router.replace('/auth');
      } finally { setIsLoading(false); }
    }).catch(() => { setIsLoading(false); router.replace('/auth'); });
  }, []);

  if (isLoading) return <View style={[styles.flex1, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color="#5B44E8" /></View>;
  if (!user) return null;

  const handleLogout = async () => { await clearAuthSession(); router.replace('/auth'); };
  return <MainApp initialUser={user} onLogout={handleLogout} />;
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: '#F8FAFC' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F0E1A' },
  headerSub: { fontSize: 20, fontWeight: '900', color: '#0F0E1A', marginTop: 8 },
  headerDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  calendarContainer: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 12 },
  calNavBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  calendarMonthText: { fontSize: 18, fontWeight: '900', color: '#0F0E1A' },
  todayDayCircle: { borderWidth: 1.5, borderColor: '#5B44E8' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekText: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', width: '14%', textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  selectedDayCircle: { backgroundColor: '#5B44E8' },
  dayText: { fontSize: 13, fontWeight: 'bold', color: '#0F0E1A' },
  selectedDayText: { color: '#FFFFFF' },

  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#0F0E1A' },
  matchCountBadge: { backgroundColor: '#5B44E8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 6 },
  matchCountText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
  gameFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  gameFilterLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  gameFilterOptions: { flexDirection: 'row', gap: 6 },
  gameFilterOption: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  gameFilterOptionActive: { borderColor: '#5B44E8', backgroundColor: '#EEF2FF' },
  gameFilterOptionText: { fontSize: 10, color: '#6B7280', fontWeight: '700' },
  gameFilterOptionTextActive: { color: '#5B44E8' },

  gameCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  sportBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  sportBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#EF4444' },
  matchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 12, gap: 24 },
  emojiCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  teamText: { fontSize: 14, fontWeight: '900', marginTop: 4 },
  teamSub: { fontSize: 10, color: '#9CA3AF' },
  vsText: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF' },

  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#0F0E1A', marginBottom: 8 },
  readOnlyInput: { height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },

  dateChip: { width: 52, height: 56, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', gap: 2 },
  dateChipActive: { backgroundColor: '#5B44E8' },
  dateChipSub: { fontSize: 10, color: '#6B7280' },
  dateChipMain: { fontSize: 14, fontWeight: '900', color: '#0F0E1A' },
  textWhite: { color: '#FFFFFF' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipBtn: { width: '31%', height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  chipActive: { backgroundColor: '#5B44E8' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipActiveText: { color: '#FFFFFF', fontWeight: 'bold' },

  locationChip: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  locationActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  locationActionText: { fontSize: 12, color: '#5B44E8', fontWeight: '800' },
  locationVerified: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 20, backgroundColor: '#ECFDF5' },
  locationVerifiedText: { fontSize: 11, color: '#059669', fontWeight: '700' },
  originSelectedCard: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, backgroundColor: '#ECFDF5' },
  favoritePlacesBox: { padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  favoritePlacesTitle: { fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 8 },
  favoritePlaceChipRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  favoritePlaceChip: { gap: 1 },
  favoritePlaceChipText: { fontSize: 11, color: '#5B44E8', fontWeight: '800' },
  favoritePlaceName: { fontSize: 10, color: '#6B7280', maxWidth: 120 },
  favoriteLabelInput: { height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, backgroundColor: '#FFF', fontSize: 12 },
  favoriteSaveBtn: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: '#5B44E8' },
  favoriteSaveBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  transportErrorText: { color: '#DC2626', fontSize: 11, fontWeight: '700' },

  outlineBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  outlineBtnActive: { borderColor: '#5B44E8', backgroundColor: '#EEF2FF' },
  outlineBtnText: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
  outlineBtnTextActive: { color: '#5B44E8', fontWeight: 'bold' },

  companionCard: { width: '48%', height: 110, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', gap: 6, position: 'relative' },
  companionCardActive: { borderColor: '#5B44E8', backgroundColor: '#EEF2FF' },
  companionText: { fontSize: 13, fontWeight: 'bold', color: '#4B5563' },
  checkCircle: { position: 'absolute', bottom: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: '#5B44E8', justifyContent: 'center', alignItems: 'center' },

  extraRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8 },
  radioEmpty: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#CBD5E1' },

  conceptBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
  conceptIconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  conceptTitle: { fontSize: 15, fontWeight: '900', color: '#0F0E1A' },
  conceptDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  radioOuterActive: { borderColor: '#5B44E8' },
  customRatioToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  customRatioToggleActive: { borderColor: '#5B44E8', backgroundColor: '#EEF2FF' },
  customRatioToggleText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  customRatioToggleTextActive: { color: '#5B44E8' },
  ratioInputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC' },
  ratioInputItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratioInputLabel: { width: 38, fontSize: 12, fontWeight: '700', color: '#374151' },
  ratioInput: { flex: 1, height: 38, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', textAlign: 'right', paddingHorizontal: 8 },
  ratioPercent: { fontSize: 12, color: '#6B7280' },
  ratioTotalText: { width: '100%', fontSize: 11, color: '#6B7280', fontWeight: '700' },

  pillChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#5B44E8', backgroundColor: '#FFF' },
  pillChipActive: { backgroundColor: '#EEF2FF' },
  pillChipText: { fontSize: 12, fontWeight: 'bold', color: '#5B44E8' },
  pillChipTextActive: { color: '#5B44E8' },

  previewCard: { backgroundColor: '#FEFCE8', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FEF08A', marginTop: 12 },
  previewTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  ratioBox: { flex: 1, backgroundColor: '#FFF', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  ratioSub: { fontSize: 10, color: '#6B7280' },
  ratioMain: { fontSize: 13, fontWeight: '900', marginTop: 2 },

  placeInputBox: { flex: 1, height: 44, borderRadius: 8, backgroundColor: '#FFF', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  addBtn: { backgroundColor: '#5B44E8', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  placeItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', gap: 10 },
  placeResultsBox: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  placeResultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  placeResultIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  placeResultMeta: { color: '#6B7280', fontSize: 11, marginTop: 3 },
  placeSelectText: { color: '#5B44E8', fontSize: 11, fontWeight: '800' },
  placeHint: { color: '#9CA3AF', fontSize: 11, textAlign: 'center', paddingVertical: 4 },
  numBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  numBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  closeCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  excludeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  excludeChipActive: { backgroundColor: '#EEF2FF', borderColor: '#5B44E8' },
  excludeChipText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  excludeChipTextActive: { color: '#5B44E8', fontWeight: 'bold' },

  aiTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 4 },
  condPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  recCardBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  recCardBoxActive: { backgroundColor: '#FEFCE8', borderColor: '#F59E0B', borderWidth: 2 },
  badgeLetter: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  yellowTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  checkedCircleOrange: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D97706', justifyContent: 'center', alignItems: 'center' },
  tagPillGrey: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  expandDescBox: { backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, marginBottom: 12 },
  previewBtn: { height: 42, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  purpleHeader: { backgroundColor: '#2E2A72', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  badgeLetterYellow: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
  statBoxCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.12)', padding: 10, borderRadius: 12, alignItems: 'center' },
  statBoxMain: { fontSize: 13, fontWeight: '900', color: '#FFF', marginTop: 2 },
  statBoxSub: { fontSize: 10, color: '#E0E7FF', marginTop: 1 },

  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineLeftNode: { alignItems: 'center' },
  timelineEmojiCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  stayTagPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },

  arrivalNoticePill: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EEF2FF', padding: 16, borderRadius: 16, marginTop: 8 },
  bookmarkOutlineBtn: { height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#5B44E8', backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },

  greenNavTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },

  mapCanvasBox: { height: 200, backgroundColor: '#E0E7FF', position: 'relative', overflow: 'hidden' },
  northBadge: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  scaleLine: { position: 'absolute', bottom: 12, left: 12 },
  mapPin: { position: 'absolute', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  mapPinText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  mapListRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', gap: 10 },
  mapListNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#9CA3AF', justifyContent: 'center', alignItems: 'center' },

  changeStatusBtn: { height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#5B44E8', backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },

  reviewStarCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  visitSpotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8 },
  visitSpotCardActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  checkCircleGreen: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },

  bigCheckCirclePurple: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#5B44E8', justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalDragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
  modalOptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 },
  modalOptionCardActive: { borderColor: '#5B44E8', backgroundColor: '#EEF2FF' },

  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  presetCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  presetIconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  diffEasy: { backgroundColor: '#ECFDF5' },
  diffNormal: { backgroundColor: '#FEF3C7' },

  saveBadgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  shareBadgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  spotCountCard: { flex: 1, backgroundColor: '#FFF', padding: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#5B44E8', padding: 16, borderRadius: 16, marginBottom: 8 },
  savedCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  savedIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  emptyListText: { padding: 28, textAlign: 'center', color: '#9CA3AF', fontSize: 13 },
  aiEmptyCard: { alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 20, padding: 24, marginTop: 24 },
  modalInput: { height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, marginTop: 14, color: '#111827', backgroundColor: '#FFF' },

  myHeaderPurple: { backgroundColor: '#2E2A72', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  avatarPurpleCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  editBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#5B44E8', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 0, right: 0 },
  changeIconPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginTop: 6, alignSelf: 'flex-start' },
  myStatBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.12)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  myMenuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  myMenuIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  myMenuLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '700' },
  myAccountActions: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 18, paddingBottom: 10 },
  smallAccountBtn: { minWidth: 72, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFF', alignItems: 'center' },
  smallAccountBtnText: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  subPageHeader: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  subPageTitle: { fontSize: 16, fontWeight: '900', color: '#374151' },
  subPageContent: { padding: 20, gap: 12 },
  accountAvatarPreview: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  accountAvatarCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF' },
  accountFieldLabel: { fontSize: 13, fontWeight: '800', color: '#4B5563', marginTop: 8, marginBottom: 6 },
  accountInput: { height: 52, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, color: '#111827', backgroundColor: '#FFF', fontSize: 14 },
  accountInputDisabled: { color: '#4B5563', backgroundColor: '#F9FAFB' },
  subPageSectionTitle: { fontSize: 17, fontWeight: '900', color: '#374151', marginTop: 6 },
  subPageDescription: { color: '#9CA3AF', fontSize: 12, lineHeight: 18 },
  subPageDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  emptyPreferenceCard: { backgroundColor: '#F5F6FB', borderRadius: 12, padding: 20, alignItems: 'center', gap: 5, marginBottom: 10 },
  emptyPreferenceTitle: { fontSize: 13, fontWeight: '800', color: '#4B5563' },
  emptyPreferenceText: { fontSize: 11, color: '#9CA3AF' },
  registeredTeamCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#F5F6FB', gap: 12 },
  registeredTeamName: { fontSize: 15, fontWeight: '900', color: '#374151' },
  registeredTeamNickname: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  deleteTeamBtn: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 6, backgroundColor: '#E5E7EB' },
  deleteTeamText: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  favoriteTeamModalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 19, fontWeight: '900', color: '#374151', marginBottom: 8 },
  sportSelectRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  sportSelectBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  sportSelectBtnActive: { borderColor: '#5B44E8', backgroundColor: '#EEF2FF' },
  sportSelectText: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },
  sportSelectTextActive: { color: '#5B44E8' },
  dropdownTrigger: { height: 52, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownMenu: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginTop: 6, backgroundColor: '#FFF', maxHeight: 170, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#6B7280', fontSize: 14, fontWeight: '800' },
  modalSaveBtn: { flex: 1, height: 50, borderRadius: 24, backgroundColor: '#5B44E8', justifyContent: 'center', alignItems: 'center' },
  emptyHistoryPanel: { minHeight: 330, justifyContent: 'center', alignItems: 'center' },
  emptyHistoryText: { color: '#5B44E8', fontSize: 14, fontWeight: '500' },
  historyCourseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9' },
  historyIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  historyCourseTitle: { fontSize: 14, fontWeight: '900', color: '#111827' },
  historyCourseRoute: { color: '#6B7280', fontSize: 11, marginTop: 3 },
  historyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 7 },
  historyMeta: { color: '#9CA3AF', fontSize: 10 },
  historyRating: { color: '#D97706', fontSize: 11, fontWeight: '800' },
  supportCard: { padding: 18, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', gap: 8 },
  supportTitle: { fontSize: 14, fontWeight: '900', color: '#374151' },
  supportText: { fontSize: 12, color: '#6B7280', lineHeight: 18 },

  tripCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  favoriteTeamsSection: { padding: 14, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4 },
  favoriteTeamsDescription: { fontSize: 10, color: '#6B7280', marginTop: 3 },
  favoriteSportTitle: { fontSize: 11, color: '#6B7280', fontWeight: '800', marginBottom: 7 },
  teamChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  teamChipActive: { backgroundColor: '#EEF2FF', borderColor: '#5B44E8' },
  teamChipText: { fontSize: 11, color: '#6B7280', fontWeight: '700' },
  teamChipTextActive: { color: '#5B44E8' },
  tripIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  tagBluePill: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  accountOutlineBtn: { height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#5B44E8', backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  accountRedOutlineBtn: { height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#EF4444', backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

  mascotPreviewBox: { backgroundColor: '#F1F5F9', paddingVertical: 24, borderRadius: 20, alignItems: 'center' },
  mascotCircleLarge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF' },
  mascotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mascotGridCard: { width: '23%', height: 86, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#F1F5F9', position: 'relative' },
  mascotGridCardActive: { borderColor: '#5B44E8', backgroundColor: '#EEF2FF', borderWidth: 2 },
  mascotGridText: { fontSize: 11, color: '#6B7280' },
  checkMiniCircle: { position: 'absolute', bottom: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#5B44E8', justifyContent: 'center', alignItems: 'center' },

  colorCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  colorCircleActive: { borderWidth: 3, borderColor: '#5B44E8' },
  selectedColorNoticePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  colorDotMini: { width: 12, height: 12, borderRadius: 6 },

  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  purpleBtn: { height: 48, borderRadius: 24, backgroundColor: '#5B44E8', justifyContent: 'center', alignItems: 'center' },
  disabledPurpleBtn: { backgroundColor: '#C9C9C9' },
  purpleBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  bottomTabBar: { flexDirection: 'row', height: 60, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  // 로그인 화면 및 스플래시 스타일
  splashContainer: { flex: 1, backgroundColor: '#312E81', justifyContent: 'center', paddingHorizontal: 32 },
  splashLogoContainer: { alignItems: 'center', marginBottom: 40 },
  splashLogoCircle: { width: 144, height: 144, borderRadius: 72, backgroundColor: '#3730A3', borderWidth: 8, borderColor: '#4338CA', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  splashTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 8 },
  splashDesc: { color: '#C7D2FE', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  splashBtnContainer: { width: '100%', gap: 12 },
  splashPrimaryBtn: { width: '100%', paddingVertical: 16, borderRadius: 100, backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  splashPrimaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  splashSnsBox: { width: '100%', borderRadius: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8 },
  splashSnsTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  splashSnsBtnRow: { flexDirection: 'row', gap: 12 },
  splashKakaoBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FEE500', alignItems: 'center' },
  splashKakaoText: { color: '#374151', fontSize: 14, fontWeight: 'bold' },
  splashGoogleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center' },
  splashGoogleText: { color: '#1F2937', fontSize: 14, fontWeight: 'bold' },
  splashPreviewBtn: { marginTop: 32, alignItems: 'center' },
  splashPreviewText: { color: '#A5B4FC', fontSize: 14, fontWeight: 'bold' },
  splashPreviewTextHighlight: { color: '#818CF8' },

  loginContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 16 },
  loginBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24, marginTop: 8 },
  loginBackText: { color: '#6B7280', fontWeight: 'bold', fontSize: 14 },
  loginTitle: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 8 },
  loginDesc: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
  loginInput: { width: '100%', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 16, fontWeight: 'bold', color: '#111827' },
  loginSubmitBtn: { width: '100%', paddingVertical: 16, borderRadius: 100, backgroundColor: '#4F46E5', alignItems: 'center', marginBottom: 24 },
  loginSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  loginLinksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  loginLinkText: { color: '#6B7280', fontWeight: 'bold', fontSize: 14 },
  loginLinkDivider: { color: '#D1D5DB' },
  loginLinkHighlight: { color: '#4F46E5', fontWeight: 'bold', fontSize: 14 },
});
