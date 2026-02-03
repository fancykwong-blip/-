
export type Symptom = '头晕' | '绞痛' | '疲劳' | '腰疼' | '情绪波动' | '粉刺' | '腹胀' | '乳房胀痛';

export type CyclePhase = 'period' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleRecord {
  id: string;
  startDate: string; // ISO format YYYY-MM-DD
  endDate?: string;  // ISO format YYYY-MM-DD
  symptoms: Symptom[];
}

export interface PredictionResult {
  nextDate: string;
  confidence: number;
  message: string;
}

export interface HealthReport {
  summary: string;
  advice: {
    diet: string;
    exercise: string;
    rest: string;
  };
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: '经期知识' | '两性健康' | '心理调适';
  date: string;
  imageUrl: string;
}

export type View = 'home' | 'calendar' | 'symptoms' | 'insights' | 'learn';
