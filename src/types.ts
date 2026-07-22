export type Competition = 
  | 'Brasileirão'
  | 'Copa Libertadores'
  | 'Copa do Brasil'
  | 'Campeonato Carioca'
  | 'Supercopa do Brasil'
  | 'Amistoso';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'normal' | 'high';
}

export interface Match {
  id: string;
  opponent: string;
  opponentLogo?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeLogo?: string;
  awayLogo?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  competition: Competition;
  location: string;
  isHome: boolean;
  notes?: string;
  tasks: Task[];
}

export interface AutoScheduleSettings {
  enabled: boolean;
  daysOfWeek: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  notificationTimes: string[]; // Ex: ["08:00", "12:00", "18:00"]
  onlyOnMatchDays: boolean; // Notificar apenas se houver jogo no dia
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
  autoSchedule?: AutoScheduleSettings;
  hasEnvToken?: boolean;
  hasEnvChatId?: boolean;
  cronSecret?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'test' | 'cron' | 'manual';
  success: boolean;
  matchId?: string;
  opponent?: string;
  error?: string;
}

export interface SystemStatus {
  matchesCount: number;
  todayMatchesCount: number;
  telegramConfigured: boolean;
  activeTokenSource: 'env' | 'database' | 'none';
  activeChatIdSource: 'env' | 'database' | 'none';
}
