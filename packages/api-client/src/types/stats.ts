export interface StatsWeekSummary {
  thisWeekHours: number;
  weekChangePercent: number | null;
  tasksDone: number;
  tasksDoneChange: number | null;
}

export interface StatsMonthSummary {
  thisMonthHours: number;
  monthChangePercent: number | null;
  avgHoursPerDay: number;
}

export interface StatsDailyPoint {
  dayLabel: string;
  date: string;
  hours: number;
  completedCount: number;
}

export interface StatsCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  hours: number;
  percent: number;
}

export interface StatsStreak {
  currentStreak: number;
  bestStreak: number;
}

export interface StatsResponse {
  weekSummary: StatsWeekSummary;
  monthSummary: StatsMonthSummary;
  weeklyChart: StatsDailyPoint[];
  categoryBreakdown: StatsCategoryBreakdown[];
  streak: StatsStreak;
  focusScore: number;
}
