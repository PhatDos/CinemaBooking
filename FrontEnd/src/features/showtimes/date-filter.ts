export type ShowtimeDateOption = {
  dateLabel: string;
  dayLabel: string;
  fullDateLabel: string;
  isPast: boolean;
  value: string;
};

const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function buildShowtimeDateOptions({
  includePast = false,
  futureDays = 7,
  pastDays = 7,
}: {
  includePast?: boolean;
  futureDays?: number;
  pastDays?: number;
} = {}): ShowtimeDateOption[] {
  const today = startOfLocalDay(new Date());
  const startOffset = includePast ? -pastDays : 0;
  const totalDays = includePast ? pastDays + futureDays : futureDays;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(today, startOffset + index);
    const value = toLocalDateValue(date);

    return {
      dateLabel: formatShortDate(value),
      dayLabel: weekdayLabels[date.getDay()],
      fullDateLabel: formatFullDate(value),
      isPast: date.getTime() < today.getTime(),
      value,
    };
  });
}

export function getTodayDateValue() {
  return toLocalDateValue(new Date());
}

export function getDateRangeForQuery(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function isBeforeToday(value: string) {
  return getLocalDateTime(value) < startOfLocalDay(new Date()).getTime();
}

export function formatShortDate(value: string) {
  const [, month, day] = value.split('-');

  return `${day}/${month}`;
}

export function formatFullDate(value: string) {
  const [year, month, day] = value.split('-');

  return `${day}/${month}/${year}`;
}

export function formatShowtimeTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toLocalDateValue(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfLocalDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

function addDays(value: Date, days: number) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate() + days,
  );
}

function getLocalDateTime(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day).getTime();
}
