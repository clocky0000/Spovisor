import { ChevronLeft, ChevronRight } from "lucide-react-native";
import * as React from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { cn } from "./utils";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function Calendar({ selected, onSelect, className, style }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected ? new Date(selected) : new Date()
  );

  // 이전 월 / 다음 월 이동
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // 날짜 그리드 계산
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 이전 달의 끝 날짜들
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from(
    { length: firstDayOfMonth },
    (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1
  );

  // 현재 달의 날짜들
  const currentMonthDays = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1
  );

  // 다음 달의 시작 날짜들 (총 6주 그리드 맞춤)
  const totalSlots = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalSlots > 35 ? 42 - totalSlots : 35 - totalSlots;
  const nextMonthDays = Array.from(
    { length: nextMonthDaysCount },
    (_, i) => i + 1
  );

  // 오늘 날짜 및 선택된 날짜 확인 함수
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === month &&
      selected.getFullYear() === year
    );
  };

  const handleSelectDay = (day: number) => {
    const newSelectedDate = new Date(year, month, day);
    onSelect?.(newSelectedDate);
  };

  return (
    <View
      className={cn(
        "p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-[340px]",
        className
      )}
      style={style}
    >
      {/* Header: 년/월 및 이동 버튼 */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <Pressable
          onPress={handlePrevMonth}
          className="h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
        >
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
        </Pressable>

        <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {year}년 {month + 1}월
        </Text>

        <Pressable
          onPress={handleNextMonth}
          className="h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
        >
          <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
        </Pressable>
      </View>

      {/* Weekday Header */}
      <View className="flex-row mb-2">
        {WEEKDAYS.map((day, index) => (
          <View key={day} className="flex-1 items-center justify-center py-1">
            <Text
              className={cn(
                "text-xs font-medium text-gray-400 dark:text-gray-500",
                index === 0 && "text-red-400",
                index === 6 && "text-blue-400"
              )}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View className="flex-row flex-wrap">
        {/* 이전 달 비활성화 날짜 */}
        {prevMonthDays.map((day) => (
          <View
            key={`prev-${day}`}
            className="w-[14.28%] aspect-square items-center justify-center"
          >
            <Text className="text-sm text-gray-300 dark:text-gray-700">{day}</Text>
          </View>
        ))}

        {/* 현재 달 날짜 */}
        {currentMonthDays.map((day) => {
          const selectedState = isSelected(day);
          const todayState = isToday(day);

          return (
            <View key={`current-${day}`} className="w-[14.28%] aspect-square p-0.5">
              <Pressable
                onPress={() => handleSelectDay(day)}
                className={cn(
                  "h-full w-full items-center justify-center rounded-xl transition-all active:opacity-70",
                  selectedState && "bg-gray-900 dark:bg-gray-100",
                  !selectedState && todayState && "bg-gray-100 dark:bg-gray-800",
                  !selectedState && !todayState && "bg-transparent"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-medium text-gray-900 dark:text-gray-100",
                    selectedState && "text-white dark:text-gray-900 font-semibold",
                    !selectedState && todayState && "text-gray-900 dark:text-gray-100 font-semibold"
                  )}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {/* 다음 달 비활성화 날짜 */}
        {nextMonthDays.map((day) => (
          <View
            key={`next-${day}`}
            className="w-[14.28%] aspect-square items-center justify-center"
          >
            <Text className="text-sm text-gray-300 dark:text-gray-700">{day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export { Calendar };
