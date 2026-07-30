import {
  ArrowLeft,
  Bookmark,
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
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
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type Sport = 'baseball' | 'soccer';
type TabType = 'home' | 'course' | 'saved' | 'my';
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

// ─────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────

const GAMES: Game[] = [
  { id: 1, sport: 'baseball', home: 'LG', away: '두산', homeEmoji: '🔴', stadium: '잠실야구장', time: '18:30', date: '2026-06-29' },
  { id: 2, sport: 'baseball', home: 'kt', away: 'NC', homeEmoji: '⚡', stadium: '수원 KT위즈파크', time: '18:30', date: '2026-06-29' },
  { id: 3, sport: 'soccer', home: 'FC 서울', away: '전북 현대', homeEmoji: '⚽', stadium: '서울 월드컵경기장', time: '19:00', date: '2026-06-29' },
];

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

export default function MainApp() {
  const [tab, setTab] = useState<TabType>('home');
  const [flow, setFlow] = useState<FlowStep>('home');
  const [selectedDate, setSelectedDate] = useState<number>(29);
  const [selectedGame, setSelectedGame] = useState<Game | null>(GAMES[1]);

  // Form State
  const [selectedGameDate, setSelectedGameDate] = useState<string>('29');
  const [startTime, setStartTime] = useState<string>('18:30');
  const [arrivalTime, setArrivalTime] = useState<string>('1시간 전');
  const [tripTiming, setTripTiming] = useState<string>('경기 전');

  const [transport, setTransport] = useState<string>('대중교통');
  const [maxTime, setMaxTime] = useState<string>('1시간');
  const [walkDist, setWalkDist] = useState<string>('20분 이하');

  const [companion, setCompanion] = useState<string>('혼로여행');
  const [extraCompanion, setExtraCompanion] = useState<string[]>([]);

  const [concept, setConcept] = useState<string>('미식 탐방형');
  const [extras, setExtras] = useState<string[]>(['실내 선호', '혼잡 피하기', '페이링 가능']);

  // Course States
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course>(MOCK_COURSES[0]);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(1);
  const [selectedPreset, setSelectedPreset] = useState<PresetCourse>(PRESET_COURSES[0]);

  // Modals & Feedback
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [selectedModalOption, setSelectedModalOption] = useState<string | null>(null);
  const [starRating, setStarRating] = useState<number>(3);
  const [visitedSpotIds, setVisitedSpotIds] = useState<number[]>([102, 103, 105]);

  // Mascot Customization
  const [selectedMascot, setSelectedMascot] = useState<MascotOption>(MASCOTS[0]);
  const [selectedBgColor, setSelectedBgColor] = useState<ColorOption>(COLOR_OPTIONS[0]);

  // Step 5 Exclude Filter
  const [excludeFilters, setExcludeFilters] = useState<string[]>([]);

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

  const toggleVisitSpot = (spotId: number) => {
    setVisitedSpotIds((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]
    );
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
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setTab('my')}>
                      <User size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.headerSub}>어떤 경기 보러 가세요?</Text>
                  <Text style={styles.headerDesc}>날짜를 선택하면 경기 일정을 보여드려요</Text>

                  {/* 달력 */}
                  <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity style={styles.calNavBtn}><ChevronLeft size={16} color="#6B7280" /></TouchableOpacity>
                      <Text style={styles.calendarMonthText}>2026년 6월</Text>
                      <TouchableOpacity style={styles.calNavBtn}><ChevronRight size={16} color="#6B7280" /></TouchableOpacity>
                    </View>

                    <View style={styles.weekRow}>
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                        <Text key={day} style={[styles.weekText, idx === 0 && { color: '#EF4444' }, idx === 6 && { color: '#3B82F6' }]}>{day}</Text>
                      ))}
                    </View>

                    <View style={styles.daysGrid}>
                      <View style={styles.dayCell} />
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                        const isSelected = selectedDate === day;
                        return (
                          <TouchableOpacity key={day} style={styles.dayCell} onPress={() => setSelectedDate(day)}>
                            <View style={[styles.dayCircle, isSelected && styles.selectedDayCircle]}>
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
                    <Text style={styles.sectionTitle}>2026.06.{selectedDate} 경기 일정</Text>
                    <View style={styles.matchCountBadge}><Text style={styles.matchCountText}>3경기</Text></View>
                  </View>

                  {GAMES.map((game) => (
                    <TouchableOpacity key={game.id} style={styles.gameCard} onPress={() => { setSelectedGame(game); setFlow('gameInfo'); }}>
                      <View style={styles.rowBetween}>
                        <View style={styles.sportBadge}><Text style={styles.sportBadgeText}>⚾ 야구</Text></View>
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
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#0F0E1A' }}>2026년 6월 {selectedGameDate}일</Text>
                    <CalendarIcon size={18} color="#5B44E8" />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { month: '6월', day: '27' },
                      { month: '6월', day: '28' },
                      { month: '6월', day: '29' },
                      { month: '7월', day: '2' },
                      { month: '7월', day: '3' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.day}
                        onPress={() => setSelectedGameDate(item.day)}
                        style={[styles.dateChip, selectedGameDate === item.day && styles.dateChipActive]}
                      >
                        <Text style={[styles.dateChipSub, selectedGameDate === item.day && styles.textWhite]}>{item.month}</Text>
                        <Text style={[styles.dateChipMain, selectedGameDate === item.day && styles.textWhite]}>{item.day}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>경기 시작 시간</Text>
                  <View style={styles.chipGrid}>
                    {['14:00', '17:00', '18:30', '19:00', '19:30', '20:00'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setStartTime(t)} style={[styles.chipBtn, startTime === t && styles.chipActive]}>
                        <Text style={[styles.chipText, startTime === t && styles.chipActiveText]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
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
                    <TextInput style={{ flex: 1, fontSize: 14 }} placeholder="예) 수원역, 강남역, 집" />
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['📍 수원역', '📍 강남역', '📍 잠실역', '📍 홍대입구역'].map((loc) => (
                      <View key={loc} style={styles.locationChip}>
                        <Text style={{ fontSize: 12, color: '#374151', fontWeight: 'bold' }}>{loc}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>이동수단 (복수 선택 가능)</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['대중교통', '자차', '도보'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setTransport(t)} style={[styles.outlineBtn, transport === t && styles.outlineBtnActive]}>
                        <Text style={[styles.outlineBtnText, transport === t && styles.outlineBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>최대 이동 가능 시간</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['30분', '1시간', '2시간'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setMaxTime(t)} style={[styles.outlineBtn, maxTime === t && styles.outlineBtnActive]}>
                        <Text style={[styles.outlineBtnText, maxTime === t && styles.outlineBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>걷는 거리</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['20분 이하', '상관없음'].map((t) => (
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
                  <Text style={styles.headerDesc}>성향에 따라 맛집, 관광지, 음식 장소의 비중이 달라요.</Text>
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
                        onPress={() => setConcept(item.id)}
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
                      <Text style={{ fontSize: 18 }}>🍜</Text>
                      <Text style={{ fontWeight: '900', fontSize: 15 }}>미식 탐방형</Text>
                      {extras.map((e) => (
                        <View key={e} style={styles.previewTag}><Text style={{ fontSize: 10, color: '#5B44E8', fontWeight: 'bold' }}>{e}</Text></View>
                      ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={styles.ratioBox}><Text style={styles.ratioSub}>맛집</Text><Text style={[styles.ratioMain, { color: '#F59E0B' }]}>60%</Text></View>
                      <View style={styles.ratioBox}><Text style={styles.ratioSub}>관광지</Text><Text style={[styles.ratioMain, { color: '#5B44E8' }]}>25%</Text></View>
                      <View style={styles.ratioBox}><Text style={styles.ratioSub}>카페</Text><Text style={[styles.ratioMain, { color: '#10B981' }]}>15%</Text></View>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('places')}><Text style={styles.purpleBtnText}>코스 만들기</Text></TouchableOpacity>
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
                      <TextInput style={{ flex: 1, fontSize: 13 }} placeholder="장소명을 입력해주세요" />
                    </View>
                    <TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+ 추가</Text></TouchableOpacity>
                  </View>

                  <View style={styles.placeItemCard}>
                    <View style={[styles.numBadge, { backgroundColor: '#F59E0B' }]}><Text style={styles.numBadgeText}>1</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 14 }}>효뜨 스타필드 수원점</Text>
                      <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>음식점 · 수원 KT위즈파크 근처</Text>
                    </View>
                    <TouchableOpacity style={styles.closeCircle}><X size={12} color="#6B7280" /></TouchableOpacity>
                  </View>

                  <View style={styles.placeItemCard}>
                    <View style={[styles.numBadge, { backgroundColor: '#10B981' }]}><Text style={styles.numBadgeText}>2</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 14 }}>행궁동 카페게리</Text>
                      <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>카페 · 수원 화성 행궁 인근</Text>
                    </View>
                    <TouchableOpacity style={styles.closeCircle}><X size={12} color="#6B7280" /></TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 }}>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 12 }}>제외 조건</Text>
                    <Text style={styles.inputLabel}>제외하고 싶은 장소</Text>
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
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('courseList')}><Text style={styles.purpleBtnText}>코스 만들기</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setFlow('courseList')} style={{ alignItems: 'center', marginTop: 10 }}>
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
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>⚾ KT vs LG</Text></View>
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>📍 수원역 출발</Text></View>
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>🍜 미식 탐방형</Text></View>
                    <View style={styles.condPill}><Text style={{ fontSize: 11, color: '#374151' }}>👫 친구와</Text></View>
                  </ScrollView>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16 }}>
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
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>A코스 · 미식 중심</Text>
                      <Text style={{ fontSize: 11, color: '#E0E7FF', marginTop: 2 }}>경기 전 맛집과 카페를 중심으로 구성했어요.</Text>
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
                  <TouchableOpacity style={styles.bookmarkOutlineBtn}>
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
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('feedbackReview')}><Text style={styles.purpleBtnText}>코스 확정하기</Text></TouchableOpacity>
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
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('feedbackDone')}><Text style={styles.purpleBtnText}>피드백 제출하기</Text></TouchableOpacity>
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
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>총 6개의 코스 저장</Text>
                  <Text style={{ fontSize: 12, color: '#E0E7FF', marginTop: 2 }}>지금까지 방문한 경기장: 4곳</Text>
                </View>
              </View>

              {SAVED_ITEMS.map((item, idx) => (
                <View key={idx} style={styles.savedCardRow}>
                  <View style={styles.savedIconCircle}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{item.stadium}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.type}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{item.date}</Text>
                    <Heart size={18} color="#EF4444" fill="#EF4444" />
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
                  <TouchableOpacity onPress={() => setFlow('home')} style={styles.backBtn}>
                    <ArrowLeft size={18} color="#0F0E1A" />
                    <Text style={styles.backText}>뒤로</Text>
                  </TouchableOpacity>
                  <Text style={styles.headerSub}>마스코드 & 배경 설정</Text>
                  <Text style={styles.headerDesc}>나만의 프로필을 꾸며보세요</Text>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 20 }}>
                  <View style={styles.mascotPreviewBox}>
                    <View style={[styles.mascotCircleLarge, { backgroundColor: selectedBgColor.hex }]}>
                      <Text style={{ fontSize: 44 }}>{selectedMascot.emoji}</Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F0E1A', marginTop: 12 }}>야구팬 김민준</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>미리보기</Text>
                  </View>

                  <Text style={styles.sectionTitle}>마스코드 선택</Text>
                  <View style={styles.mascotGrid}>
                    {MASCOTS.map((item) => {
                      const isSelected = selectedMascot.id === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => setSelectedMascot(item)}
                          style={[styles.mascotGridCard, isSelected && styles.mascotGridCardActive]}
                        >
                          <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                          <Text style={[styles.mascotGridText, isSelected && { color: '#5B44E8', fontWeight: 'bold' }]}>{item.name}</Text>
                          {isSelected && (
                            <View style={styles.checkMiniCircle}>
                              <Check size={10} color="#FFF" strokeWidth={3} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.sectionTitle}>배경 색상</Text>
                  <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 4 }}>
                    {COLOR_OPTIONS.map((color) => {
                      const isSelected = selectedBgColor.id === color.id;
                      return (
                        <TouchableOpacity key={color.id} onPress={() => setSelectedBgColor(color)} style={{ alignItems: 'center', gap: 4 }}>
                          <View style={[styles.colorCircle, { backgroundColor: color.hex }, isSelected && styles.colorCircleActive]}>
                            {isSelected && <Check size={16} color="#FFF" strokeWidth={3} />}
                          </View>
                          <Text style={{ fontSize: 11, color: isSelected ? '#5B44E8' : '#6B7280', fontWeight: isSelected ? 'bold' : 'normal' }}>{color.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.selectedColorNoticePill}>
                    <View style={[styles.colorDotMini, { backgroundColor: selectedBgColor.hex }]} />
                    <Text style={{ fontSize: 12, color: '#5B44E8', fontWeight: 'bold' }}>근간 색: {selectedBgColor.name}</Text>
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.purpleBtn} onPress={() => setFlow('home')}>
                    <Text style={styles.purpleBtnText}>설정하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.flex1}>
                <View style={styles.myHeaderPurple}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowCenter}><Text style={{ fontSize: 18 }}>🏆</Text><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>스포바이저</Text></View>
                    <TouchableOpacity><Text style={{ fontSize: 12, color: '#E0E7FF' }}>로그아웃</Text></TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 }}>
                    <TouchableOpacity style={[styles.avatarPurpleCircle, { backgroundColor: selectedBgColor.hex }]} onPress={() => setFlow('customizeMascot')}>
                      <Text style={{ fontSize: 28 }}>{selectedMascot.emoji}</Text>
                      <View style={styles.editBadge}><Pencil size={10} color="#FFF" /></View>
                    </TouchableOpacity>
                    <View>
                      <View style={styles.rowCenter}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF' }}>야구팬 김민준</Text>
                        <Pencil size={14} color="#E0E7FF" />
                      </View>
                      <Text style={{ fontSize: 12, color: '#E0E7FF', marginTop: 2 }}>⭐ MVP 멤버 · 가입 2024.03.15</Text>
                      <TouchableOpacity style={styles.changeIconPill} onPress={() => setFlow('customizeMascot')}>
                        <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold' }}>🏆 아이콘으로 변경</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
                    <View style={styles.myStatBox}><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>5</Text><Text style={{ fontSize: 10, color: '#E0E7FF' }}>방문 경기장</Text></View>
                    <View style={styles.myStatBox}><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>6</Text><Text style={{ fontSize: 10, color: '#E0E7FF' }}>저장 코스</Text></View>
                    <View style={styles.myStatBox}><Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF' }}>5</Text><Text style={{ fontSize: 10, color: '#E0E7FF' }}>여행 횟수</Text></View>
                  </View>
                </View>

                <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 12 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>내 여행리스트</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>총 5건</Text>
                  </View>

                  {MY_TRIP_LIST.map((trip, idx) => (
                    <View key={idx} style={styles.tripCardRow}>
                      <View style={styles.tripIconCircle}><Text style={{ fontSize: 20 }}>{trip.icon}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{trip.stadium}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{trip.match}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 }}>
                          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{trip.date}</Text>
                          <View style={styles.tagBluePill}><Text style={{ fontSize: 10, color: '#5B44E8', fontWeight: 'bold' }}>{trip.tag}</Text></View>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} color={i < trip.rating ? '#F59E0B' : '#E2E8F0'} fill={i < trip.rating ? '#F59E0B' : 'transparent'} />
                          ))}
                        </View>
                        <ChevronRight size={16} color="#9CA3AF" />
                      </View>
                    </View>
                  ))}

                  <View style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>계정 관리</Text>
                  </View>

                  <TouchableOpacity style={styles.accountOutlineBtn}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#5B44E8' }}>비밀번호 변경</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.accountRedOutlineBtn}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#EF4444' }}>회원탈퇴 및 데이터 삭제</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>

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

  myHeaderPurple: { backgroundColor: '#2E2A72', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  avatarPurpleCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  editBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#5B44E8', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 0, right: 0 },
  changeIconPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginTop: 6, alignSelf: 'flex-start' },
  myStatBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.12)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },

  tripCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
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
  purpleBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  bottomTabBar: { flexDirection: 'row', height: 60, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});