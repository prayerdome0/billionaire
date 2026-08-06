import raw from "./content.json";

export interface Niche {
  id: string;
  title: string;
  icon: string;
  image: string;
  description: string;
  potentialEarnings: string;
  examples: BillionaireExample[];
  strategies: string[];
  whyHighPaying: string;
  gettingStarted: string[];
}

export interface BillionaireExample {
  name: string;
  netWorth: string;
  company: string;
  story: string;
}

export interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface Founder {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  quote: string;
  focus: string[];
  funFact: string;
  email: string;
  socials: { linkedin: string; twitter: string };
}

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: string;
}

export interface LessonSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  duration: string;
  difficulty: string;
  content: LessonSection[];
  takeaways: string[];
  actionSteps: string[];
  quiz: QuizQuestion[];
}

export interface Video {
  id: string;
  title: string;
  channel: string;
  description: string;
  youtubeId: string;
  moduleId: string;
  duration: string;
  level: string;
  tags: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  authorId: string;
  date: string;
  readTime: string;
  tags: string[];
  content: { heading: string; paragraphs: string[] }[];
}

export interface SiteStat {
  label: string;
  value: string;
}

export const site: { name: string; tagline: string; description: string } = raw.site;
export const siteStats: SiteStat[] = raw.siteStats;
export const heroImage = raw.heroImage;
export const stepsToWealth: Step[] = raw.stepsToWealth;
export const wealthPrinciples = raw.wealthPrinciples;
export const founders: Founder[] = raw.founders;
export const testimonials: Testimonial[] = raw.testimonials;
export const modules: Module[] = raw.modules;
export const lessons: Lesson[] = raw.lessons;
export const videos: Video[] = raw.videos;
export const niches: Niche[] = raw.niches;
export const posts: BlogPost[] = raw.posts;

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getModule(id: string): Module | undefined {
  return modules.find((m) => m.id === id);
}

export function getVideo(id: string): Video | undefined {
  return videos.find((v) => v.id === id);
}

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getFounder(id: string): Founder | undefined {
  return founders.find((f) => f.id === id);
}

export function lessonsForModule(moduleId: string): Lesson[] {
  return lessons
    .filter((l) => l.moduleId === moduleId)
    .sort((a, b) => a.number - b.number);
}

export function videosForModule(moduleId: string): Video[] {
  return videos.filter((v) => v.moduleId === moduleId);
}

export function moduleProgress(completedIds: Set<string>): number {
  if (lessons.length === 0) return 0;
  let done = 0;
  for (const l of lessons) if (completedIds.has(l.id)) done += 1;
  return Math.round((done / lessons.length) * 100);
}
