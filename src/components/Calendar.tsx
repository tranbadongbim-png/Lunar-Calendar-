import React, { useState, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import vnlunar from '@min98/vnlunar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

const PROVERBS = [
  "Chớ đi ngày bảy, chớ về ngày ba.",
  "Mùng năm, mười bốn, hai ba / Đi chơi còn thiệt, nữa là đi buôn.",
  "Tháng giêng rét đài, tháng hai rét lộc, tháng ba rét nàng Bân.",
  "Đêm tháng năm chưa nằm đã sáng / Ngày tháng mười chưa cười đã tối.",
  "Tháng bảy kiến bò, chỉ lo lại lụt.",
  "Tháng tám nắng rám trái bưởi.",
  "Tháng chín mưa rươi, tháng mười mưa cữ.",
  "Tháng chạp là tháng trồng khoai / Tháng giêng trồng đậu, tháng hai trồng cà.",
  "Trời chớp đằng đông, vừa trông vừa chạy.",
  "Chuồn chuồn bay thấp thì mưa / Bay cao thì nắng, bay vừa thì râm.",
  "Ếch kêu uôm uôm, ao chuôm đầy nước.",
  "Mây kéo xuống biển thì nắng chang chang / Mây kéo lên ngàn thì mưa như trút.",
  "Trăng quầng thì hạn, trăng tán thì mưa.",
  "Cơn đằng đông vừa trông vừa chạy / Cơn đằng nam vừa làm vừa chơi.",
  "Gió heo may, chuồn chuồn bay thì bão."
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Tự động cập nhật ngày khi qua 00:00 (nửa đêm)
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      const newDate = new Date();
      // Chỉ tự động chuyển ngày nếu người dùng đang xem tháng hiện tại
      // và ngày đang chọn là "hôm nay" của ngày cũ
      if (isSameMonth(currentDate, now) && isSameDay(selectedDate, now)) {
        setCurrentDate(newDate);
        setSelectedDate(newDate);
      }
    }, timeUntilMidnight + 1000); // Thêm 1 giây để đảm bảo đã qua ngày mới

    return () => clearTimeout(timer);
  }, [currentDate, selectedDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = (day: Date) => setSelectedDate(day);

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button 
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDate(today);
            }}
            className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            Hôm nay
          </button>
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: vi })}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-medium text-xs text-gray-500 dark:text-gray-400 py-2 uppercase tracking-wider">
          {format(addDays(startDate, i), 'EEEEEE', { locale: vi })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Calculate Lunar Date
        const lunarDate = vnlunar.convert_solar_to_lunar(
          day.getDate(),
          day.getMonth() + 1,
          day.getFullYear(),
          7
        );
        
        const isFirstLunarDay = lunarDate.day === 1;
        const lunarText = isFirstLunarDay ? `${lunarDate.day}/${lunarDate.month}` : `${lunarDate.day}`;

        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isCurrentDay = isToday(day);

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            className={clsx(
              "relative flex flex-col items-center justify-center p-1 h-14 cursor-pointer transition-all rounded-xl",
              !isCurrentMonth && "opacity-40",
              isSelected
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : isCurrentDay
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
              isSelected && "font-semibold"
            )}
          >
            <span className="text-base leading-none">{formattedDate}</span>
            <span className={clsx(
              "text-[10px] mt-1 leading-none",
              isSelected 
                ? "text-indigo-100" 
                : isFirstLunarDay 
                  ? "text-red-500 font-medium" 
                  : "text-gray-400 dark:text-gray-500"
            )}>
              {lunarText}
            </span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const renderDetails = () => {
    const fullInfo = vnlunar.getFullInfo(
      selectedDate.getDate(),
      selectedDate.getMonth() + 1,
      selectedDate.getFullYear()
    );

    const { lunar, can_chi, day_type, auspicious_hours, jd } = fullInfo;
    const proverb = PROVERBS[jd % PROVERBS.length];

    return (
      <div className="mt-6 space-y-4">
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
              </h3>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-gray-400 text-xs uppercase tracking-wider font-medium">Âm lịch</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    Ngày {lunar.day} tháng {lunar.month} năm {lunar.year}
                    {lunar.leap === 1 ? ' (Nhuận)' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-gray-400 text-xs uppercase tracking-wider font-medium">Can chi</span>
                  <span>
                    Ngày {can_chi.day}, tháng {can_chi.month}, năm {can_chi.year}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-gray-400 text-xs uppercase tracking-wider font-medium">Loại ngày</span>
                  <span className={clsx("font-medium", day_type.good ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                    {day_type.type} ({day_type.star})
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[4.5rem] px-2 h-16 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
              <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">Tháng {lunar.month}</span>
              <span className="text-2xl font-bold leading-none mt-0.5">{lunar.day}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Giờ Hoàng Đạo</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
            {auspicious_hours.replace(/\n/g, ' ')}
          </p>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/20">
          <p className="text-sm italic text-amber-800 dark:text-amber-400 text-center font-medium">
            "{proverb}"
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto w-full bg-white dark:bg-gray-900 min-h-screen sm:min-h-fit sm:rounded-[2rem] sm:shadow-2xl sm:border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-5 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lịch Việt</h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        {renderHeader()}
        {renderDays()}
        {renderCells()}
        {renderDetails()}
        
        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Lịch Việt
          </p>
          <p className="text-[10px] text-gray-400/80 dark:text-gray-500/80">
            Design by Dong
          </p>
        </div>
      </div>
    </div>
  );
}
