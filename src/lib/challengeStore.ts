/**
 * 365 Challenge progress store — localStorage + optional Firestore sync
 */
import { challenges365, type DailyChallenge } from "../data/challenge365";

export interface ChallengeProgress {
  day: number;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  timeSpent?: number;
}

const KEY = "seedwel-365-progress-v1";
const START_KEY = "seedwel-365-start-v1";

export function getStartDate(): string {
  const existing = localStorage.getItem(START_KEY);
  if (existing) return existing;
  const today = new Date().toISOString();
  localStorage.setItem(START_KEY, today);
  return today;
}

export function setStartDate(dateISO: string) {
  localStorage.setItem(START_KEY, dateISO);
}

export function getProgress(): ChallengeProgress[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch { return []; }
}

export function saveProgress(list: ChallengeProgress[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function completeDay(day: number, notes?: string, timeSpent?: number) {
  const list = getProgress();
  const idx = list.findIndex(p => p.day === day);
  const entry: ChallengeProgress = { day, completed: true, completedAt: new Date().toISOString(), notes, timeSpent };
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  saveProgress(list);
  return list;
}

export function uncompleteDay(day: number) {
  const list = getProgress().filter(p => p.day !== day);
  saveProgress(list);
  return list;
}

export function isCompleted(day: number): boolean {
  return getProgress().some(p => p.day === day && p.completed);
}

export function stats() {
  const prog = getProgress();
  const completed = prog.filter(p => p.completed).length;
  const totalPoints = prog.reduce((acc, p) => {
    const chal = challenges365.find(c => c.day === p.day);
    return acc + (chal?.points || 0);
  }, 0);
  const streak = calcStreak(prog);
  const level = completed < 30 ? "Starter" : completed < 90 ? "Builder" : completed < 180 ? "Warrior" : "Billionaire";
  return { completed, total: 365, pct: Math.round((completed / 365) * 100), totalPoints, streak, level };
}

function calcStreak(prog: ChallengeProgress[]): number {
  if (prog.length === 0) return 0;
  const sorted = [...prog].sort((a, b) => b.day - a.day);
  let streak = 0;
  let expected = Math.max(...sorted.map(p => p.day));
  // Count consecutive from latest backwards
  const set = new Set(sorted.filter(p => p.completed).map(p => p.day));
  while (set.has(expected)) {
    streak++;
    expected--;
  }
  return streak;
}

export function getCurrentDay(startISO: string): number {
  const start = new Date(startISO);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(365, diff));
}
