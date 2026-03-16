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
  subDays,
  isToday,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import vnlunar from '@min98/vnlunar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Moon, Sun, LayoutGrid, CalendarDays, Plus, X, ListTodo } from 'lucide-react';
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

const SOLAR_HOLIDAYS: Record<string, string> = {
  "1/1": "Tết Dương lịch",
  "14/2": "Lễ tình nhân (Valentine)",
  "8/3": "Quốc tế Phụ nữ",
  "30/4": "Ngày Giải phóng miền Nam",
  "1/5": "Quốc tế Lao động",
  "1/6": "Quốc tế Thiếu nhi",
  "2/9": "Quốc khánh",
  "20/10": "Ngày Phụ nữ Việt Nam",
  "20/11": "Ngày Nhà giáo Việt Nam",
  "22/12": "Ngày thành lập QĐND Việt Nam",
  "24/12": "Giáng sinh",
  "25/12": "Giáng sinh"
};

const LUNAR_HOLIDAYS: Record<string, string> = {
  "1/1": "Tết Nguyên Đán",
  "2/1": "Mùng 2 Tết",
  "3/1": "Mùng 3 Tết",
  "15/1": "Rằm tháng Giêng (Tết Nguyên Tiêu)",
  "3/3": "Tết Hàn Thực",
  "10/3": "Giỗ Tổ Hùng Vương",
  "15/4": "Lễ Phật Đản",
  "5/5": "Tết Đoan Ngọ",
  "15/7": "Lễ Vu Lan",
  "15/8": "Tết Trung Thu",
  "23/12": "Ông Táo chầu trời",
  "30/12": "Giao Thừa" // Cần check thêm năm thiếu (29/12)
};

const getHolidays = (solarDate: Date, lunarDay: number, lunarMonth: number, lunarYear: number) => {
  const holidays = [];
  
  // Check Solar
  const solarKey = `${solarDate.getDate()}/${solarDate.getMonth() + 1}`;
  if (SOLAR_HOLIDAYS[solarKey]) {
    holidays.push(SOLAR_HOLIDAYS[solarKey]);
  }

  // Check Lunar
  const lunarKey = `${lunarDay}/${lunarMonth}`;
  if (LUNAR_HOLIDAYS[lunarKey]) {
    holidays.push(LUNAR_HOLIDAYS[lunarKey]);
  } else if (lunarMonth === 12) {
    // Check Giao Thừa for short months (29 days)
    const nextDayLunar = vnlunar.convert_solar_to_lunar(
      solarDate.getDate() + 1,
      solarDate.getMonth() + 1,
      solarDate.getFullYear(),
      7
    );
    if (nextDayLunar.day === 1 && nextDayLunar.month === 1 && lunarDay === 29) {
      holidays.push("Giao Thừa");
    }
  }

  return holidays;
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'year'>('day');
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
  const nextYear = () => setCurrentDate(addMonths(currentDate, 12));
  const prevYear = () => setCurrentDate(subMonths(currentDate, 12));
  const onDateClick = (day: Date) => setSelectedDate(day);

  const renderHeader = () => {
    const isYearView = viewMode === 'year';
    return (
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-2">
          <button onClick={isYearView ? prevYear : prevMonth} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button 
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDate(today);
            }}
            className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
          >
            Hôm nay
          </button>
        </div>
        <h2 
          className="text-lg font-semibold text-gray-800 dark:text-gray-100 capitalize cursor-pointer hover:text-indigo-600 transition-colors"
          onClick={() => setViewMode(isYearView ? 'month' : 'year')}
        >
          {isYearView ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy', { locale: vi })}
        </h2>
        <button onClick={isYearView ? nextYear : nextMonth} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
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
        const dateKey = format(day, 'yyyy-MM-dd');
        const holidays = getHolidays(day, lunarDate.day, lunarDate.month, lunarDate.year);
        const hasHoliday = holidays.length > 0;

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            className={clsx(
              "relative flex flex-col items-center justify-center p-1 h-14 cursor-pointer transition-all rounded-xl",
              !isCurrentMonth && "opacity-40",
              isSelected
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 dark:shadow-none"
                : isCurrentDay
                ? "bg-indigo-50/80 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                : hasHoliday
                ? "bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30"
                : "text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-white/10",
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
                  : hasHoliday
                  ? "text-red-400 dark:text-red-500"
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
    const holidays = getHolidays(selectedDate, lunar.day, lunar.month, lunar.year);

    return (
      <div className="mt-6 space-y-4">
        <div className="p-5 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
              </h3>
              {holidays.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {holidays.map((holiday, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-md">
                      {holiday}
                    </span>
                  ))}
                </div>
              )}
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

        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10">
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Giờ Hoàng Đạo</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
            {auspicious_hours.replace(/\n/g, ' ')}
          </p>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10">
          <p className="text-sm italic text-amber-800 dark:text-amber-400 text-center font-medium">
            "{proverb}"
          </p>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const fullInfo = vnlunar.getFullInfo(
      selectedDate.getDate(),
      selectedDate.getMonth() + 1,
      selectedDate.getFullYear()
    );
    const { lunar, can_chi, day_type, auspicious_hours, jd } = fullInfo;
    const proverb = PROVERBS[jd % PROVERBS.length];
    const holidays = getHolidays(selectedDate, lunar.day, lunar.month, lunar.year);

    return (
      <div className="flex flex-col items-center animate-in fade-in duration-300">
        <div className="flex justify-between items-center w-full mb-6 px-2">
          <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button 
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDate(today);
            }}
            className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
          >
            Hôm nay
          </button>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Lịch Block */}
        <div className="w-full max-w-sm bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/50 dark:border-white/10 overflow-hidden mb-6">
          <div className="bg-red-600/90 dark:bg-red-700/90 backdrop-blur-md text-white text-center py-4 border-b border-white/20">
            <h2 className="text-xl font-bold uppercase tracking-widest">
              Tháng {format(selectedDate, 'M')}
            </h2>
            <p className="text-red-100 text-sm">
              {format(selectedDate, 'yyyy')}
            </p>
          </div>
          <div className="py-8 flex flex-col items-center">
            <p className="text-2xl text-gray-500 dark:text-gray-400 font-medium mb-2 capitalize">
              {format(selectedDate, 'EEEE', { locale: vi })}
            </p>
            <h1 className="text-8xl font-bold text-gray-900 dark:text-white mb-6">
              {format(selectedDate, 'd')}
            </h1>
            {holidays.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6 px-4">
                {holidays.map((holiday, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-full text-center">
                    {holiday}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1">Tháng Âm</p>
                <p className="text-red-600 dark:text-red-400 text-xl">{lunar.month}</p>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1">Ngày Âm</p>
                <p className="text-red-600 dark:text-red-400 text-xl">{lunar.day}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-4 border-t border-white/50 dark:border-white/10 text-center space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Ngày <span className="font-semibold">{can_chi.day}</span>, tháng <span className="font-semibold">{can_chi.month}</span>, năm <span className="font-semibold">{can_chi.year}</span>
            </p>
            <p className={clsx("text-sm font-medium", day_type.good ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
              {day_type.type} ({day_type.star})
            </p>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10">
            <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Giờ Hoàng Đạo</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
              {auspicious_hours.replace(/\n/g, ' ')}
            </p>
          </div>

          <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10">
            <p className="text-sm italic text-amber-800 dark:text-amber-400 text-center font-medium">
              "{proverb}"
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMiniMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const cloneDay = day;
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isCurrentDay = isToday(day);
      const isSelected = isSameDay(day, selectedDate);

      days.push(
        <div
          key={day.toString()}
          onClick={() => {
            if (isCurrentMonth) {
              setSelectedDate(cloneDay);
              setCurrentDate(cloneDay);
              setViewMode('day');
            }
          }}
          className={clsx(
            "text-[9px] h-5 flex items-center justify-center rounded-sm transition-colors",
            isCurrentMonth ? "cursor-pointer" : "opacity-0 pointer-events-none",
            isCurrentMonth && isSelected && "bg-indigo-600 text-white font-bold",
            isCurrentMonth && !isSelected && isCurrentDay && "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 font-bold",
            isCurrentMonth && !isSelected && !isCurrentDay && "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
          )}
        >
          {isCurrentMonth ? format(day, 'd') : ''}
        </div>
      );
      day = addDays(day, 1);
    }
    return days;
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(year, i, 1);
      months.push(
        <div key={i} className="flex flex-col items-center">
          <h3 
            className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 cursor-pointer hover:text-indigo-600 transition-colors"
            onClick={() => {
              setCurrentDate(monthDate);
              setViewMode('month');
            }}
          >
            Tháng {i + 1}
          </h3>
          <div className="grid grid-cols-7 gap-x-0.5 gap-y-0.5 w-full max-w-[140px]">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <div key={d} className="text-[8px] text-center text-gray-400 font-medium mb-1">{d}</div>
            ))}
            {renderMiniMonth(monthDate)}
          </div>
        </div>
      );
    }
    
    return (
      <div className="animate-in fade-in duration-300">
        {renderHeader()}
        <div className="grid grid-cols-3 gap-x-2 gap-y-6">
          {months}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto w-full bg-white/60 dark:bg-black/40 backdrop-blur-xl min-h-screen sm:min-h-fit sm:rounded-[2rem] sm:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] sm:border border-white/40 dark:border-white/10 overflow-hidden">
      <div className="p-5 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50/80 dark:bg-indigo-900/40 backdrop-blur-sm rounded-xl">
              <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lịch Việt</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'day' ? 'month' : viewMode === 'month' ? 'year' : 'day')}
              className="p-2 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/10 transition-colors border border-white/20 dark:border-white/5"
              aria-label="Toggle view mode"
            >
              {viewMode === 'day' ? <CalendarDays className="w-5 h-5" /> : viewMode === 'month' ? <LayoutGrid className="w-5 h-5" /> : <ListTodo className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/10 transition-colors border border-white/20 dark:border-white/5"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {viewMode === 'year' ? (
          renderYearView()
        ) : viewMode === 'month' ? (
          <div className="animate-in fade-in duration-300">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            {renderDetails()}
          </div>
        ) : (
          renderDayView()
        )}
        
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
