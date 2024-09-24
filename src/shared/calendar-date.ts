/**
 * Represents a date on the calendar.
 */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
  time: TimeOfDay;
}

/**
 * Create a CalendarDate object
 * @param year Year of date
 * @param month Number of month starting with 1. Jan = 1, Feb = 2
 * @param day Day of month starting with 1
 * @param hour Hour of the day. 12am = 0
 * @param minute Minutes in the hour 1:35 = 35
 */
export const calendarDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): CalendarDate => {
  const date = { year, month, day, time: timeOfDay(hour, minute) };
  if (!isCalendarDate(date)) {
    throw new Error(`Invalid date. ${JSON.stringify(date, null, '')}`);
  }
  return date;
};

/**
 * Checks if an object is a CalendarDate
 */
export const isCalendarDate = (d: unknown): d is CalendarDate => {
  const date = d as CalendarDate;
  return (date?.year >= 0 && date?.year < 3000)
    && (date?.month >= 1 && date?.month <= 12)
    && (date?.day >= 1 && date?.day <= 31)
    && isTimeOfDay(date?.time);
};

/**
 * Represents the time of day in minutes elapsed from 12:00am
 */
export interface TimeOfDay {
  minutes: number;
}

/**
 * Create a TimeOfDay object
 * @param h Hour of the day 0 - 23
 * @param m Minut of the hour 0 - 60
 */
export const timeOfDay = (h: number, m: number): TimeOfDay => {
  const time = { minutes: h * 60 + m };
  if (!isTimeOfDay(time)) {
    throw new Error(`Invalid time of day ${JSON.stringify(time, null, '')}`);
  }
  return time;
};

/**
 * Checks if an object is a TimeOfDay
 */
export const isTimeOfDay = (t: unknown): t is TimeOfDay => {
  const time = t as TimeOfDay;
  return time?.minutes >= 0 && time?.minutes <= 24 * 60;
};
