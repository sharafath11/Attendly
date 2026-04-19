/** Shared Asia/Kolkata helpers for jobs and dashboards. */

export function istDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function istHour(): number {
  const hourPart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  })
    .formatToParts(new Date())
    .find((p) => p.type === "hour");
  return Number(hourPart?.value ?? 0);
}

export function istWeekdayShort(): string {
  return new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "short" });
}

export function istCalendarDay(): number {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return Number(s.split("-")[2]);
}

export function istMonthYear(): { month: number; year: number } {
  const parts = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).split("-");
  return { year: Number(parts[0]), month: Number(parts[1]) };
}

export function istDayBoundsUtc(): { start: Date; end: Date } {
  const s = istDateString();
  return {
    start: new Date(`${s}T00:00:00+05:30`),
    end: new Date(`${s}T23:59:59.999+05:30`),
  };
}

export function istMonthBoundsUtc(): { start: Date; end: Date } {
  const { month, year } = istMonthYear();
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(-1);
  return { start, end };
}
