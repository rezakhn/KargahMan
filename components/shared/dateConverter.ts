import jalaali from 'jalaali-js';

export type ShamsiDate = {
  year: number;
  month: number;
  day: number;
};

// Converts Gregorian YYYY-MM-DD string to ShamsiDate object
export const gregorianToShamsi = (isoDate: string): ShamsiDate | null => {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const parts = isoDate.split('-');
  if (parts.length !== 3) return null;
  const [gy, gm, gd] = parts.map(Number);
  if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return null;
  try {
    const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
    return { year: jy, month: jm, day: jd };
  } catch(e) {
    console.error("Error converting Gregorian to Shamsi", isoDate, e);
    return null;
  }
};

// Converts ShamsiDate object to Gregorian YYYY-MM-DD string
export const shamsiToGregorian = (shamsiDate: ShamsiDate): string | null => {
  if (!shamsiDate) return null;
  try {
    const { gy, gm, gd } = jalaali.toGregorian(shamsiDate.year, shamsiDate.month, shamsiDate.day);
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  } catch(e) {
    console.error("Error converting Shamsi to Gregorian", shamsiDate, e);
    return null;
  }
};

export const getTodayGregorian = (): string => {
    return new Date().toISOString().split('T')[0];
}

export const getShamsiMonthStartEnd = (dateInMonth: Date) => {
    const { jy, jm } = jalaali.toJalaali(dateInMonth.getFullYear(), dateInMonth.getMonth() + 1, dateInMonth.getDate());
    const firstDayShamsi = { year: jy, month: jm, day: 1 };
    
    const monthLength = jalaali.jalaaliMonthLength(jy, jm);
    const lastDayShamsi = { year: jy, month: jm, day: monthLength };
    
    return {
        start: shamsiToGregorian(firstDayShamsi),
        end: shamsiToGregorian(lastDayShamsi)
    };
}