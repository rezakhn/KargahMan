import React, { useState, useEffect } from 'react';
import DatePicker from 'react-modern-persian-datepicker';
import type { DayValue } from 'react-modern-persian-datepicker';
import { gregorianToShamsi, shamsiToGregorian } from './dateConverter.ts';

interface PersianDatePickerProps {
  value: string; // YYYY-MM-DD Gregorian
  onChange: (value: string) => void;
  inputId?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({ value, onChange, inputId }) => {
  // The DatePicker library uses null for empty state, which works well for us.
  const [selectedDay, setSelectedDay] = useState<DayValue>(gregorianToShamsi(value));

  useEffect(() => {
    setSelectedDay(gregorianToShamsi(value));
  }, [value]);

  const handleChange = (day: DayValue) => {
    setSelectedDay(day);
    if (day) {
      const gregorianDate = shamsiToGregorian(day);
      if (gregorianDate) {
          onChange(gregorianDate);
      }
    } else {
        // Handle case where date is cleared if needed by passing an empty string
        onChange('');
    }
  };

  return (
    <DatePicker
      value={selectedDay}
      onChange={handleChange}
      shouldHighlightWeekends
      locale="fa"
      inputClassName="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-on-surface"
      inputPlaceholder="تاریخ را انتخاب کنید"
      inputId={inputId}
    />
  );
};

export default PersianDatePicker;