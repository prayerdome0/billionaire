/**
 * Journey to Success — 365 Days Challenge
 * Each day: category, title, description, action steps, time, points, quote
 */

export type ChallengeCategory = "Mindset" | "Money" | "Business" | "Skills" | "Health" | "Network" | "Investment" | "AI";
export type ChallengeDifficulty = "Starter" | "Builder" | "Warrior" | "Billionaire";

export interface DailyChallenge {
  day: number;
  title: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  description: string;
  actions: string[];
  timeMinutes: number;
  points: number;
  quote: string;
  quoteAuthor: string;
  videoId?: string; // youtube suggestion
  reflection: string;
  reward: string;
}

function generateYear(): DailyChallenge[] {
  const categories: ChallengeCategory[] = ["Mindset", "Money", "Business", "Skills", "Health", "Network", "Investment", "AI"];
  const quotes = [
    { q: "The best time to plant a tree was 20 years ago. The second best time is now.", a: "Chinese Proverb" },
    { q: "You don't need money to start a business. You need an idea and the will to work.", a: "Strive Masiyiwa" },
    { q: "Think like a queen. A queen is not afraid to fail.", a: "Oprah Winfrey" },
    { q: "I will tell you how to become rich. Close doors. Be fearful when others greedy.", a: "Warren Buffett" },
    { q: "Nothing comes easy; you have to work for it.", a: "Aliko Dangote" },
    { q: "Don't wait for permission to tell your own story.", a: "Mo Abudu" },
    { q: "Success is a lousy teacher. It seduces smart people into thinking they can't lose.", a: "Bill Gates" },
    { q: "Never give up. Today is hard, tomorrow will be worse, but day after tomorrow will be sunshine.", a: "Jack Ma" }
  ];

  const templates: Omit<DailyChallenge, "day" | "quote" | "quoteAuthor" | "timeMinutes" | "points" | "difficulty">[] = [
    {
      title: "Write Your 10-Year Wealth Vision",
      category: "Mindset",
      description: "All billionaires start with a written vision. Describe your life at peak wealth: net worth, impact, daily routine, location. Make it visceral.",
      actions: ["Open notebook, write 'My 10-Year Empire' at top", "Describe net worth, 3 businesses, 2 properties, daily morning routine", "Share vision with one trusted person within 24h"],
      videoId: "UF8uR6Z6KLc",
      reflection: "What scares you about your vision? That's growth edge.",
      reward: "Vision Clarity Badge"
    },
    {
      title: "Calculate Your Actual Net Worth",
      category: "Money",
      description: "You can't improve what you don't measure. Assets minus liabilities = truth. Most people are shocked.",
      actions: ["List every asset: cash, mobile money, stock, land", "List every liability: loan, debt, subscription", "Net worth = assets - liabilities. Screenshot it."],
      videoId: "PHe0bXAIuk0",
      reflection: "Was your number higher or lower than gut feeling? Why?",
      reward: "Money Truth Badge"
    },
    {
      title: "50 Problem Interviews",
      category: "Business",
      description: "Stop building, start asking. Interview 5 people today about their #1 work frustration. Don't pitch — listen.",
      actions: ["DM or call 5 people in your target industry", "Ask: What task do you hate most? What have you paid to fix?", "Log answers in spreadsheet. Look for pattern by day 10."],
      videoId: "bNpx7gpSqbY",
      reflection: "What painful problem was repeated?",
      reward: "Listener Badge"
    },
    {
      title: "Learn One AI Skill Today",
      category: "AI",
      description: "AI economy rewards doers, not readers. Build one tiny AI automation today. Prompt engineering, image generation, or API call.",
      actions: ["Go to chat.openai.com or huggingface.co and ask it to write business plan for your skill", "Save output, edit to perfect, publish as LinkedIn post", "Comment what AI got wrong — that's your moat"],
      videoId: "FgF53b_ETRg",
      reflection: "What could you automate this week with this tool?",
      reward: "AI Builder Badge"
    },
    {
      title: "The $100 Offer",
      category: "Business",
      description: "Sell something today for $100. A resume review, Canva logo, 1-hour tutoring. Prove market pays you.",
      actions: ["Write 3-line offer: 'I help [audience] get [outcome] in [time]'", "Post offer on WhatsApp status, Facebook group, LinkedIn", "Close 1 paying customer today, deliver tomorrow"],
      videoId: "u4ZoJKF_VuA",
      reflection: "How did it feel to ask for money? What objection came up?",
      reward: "$100 Club"
    },
    {
      title: "Invest First $10 in Index Fund",
      category: "Investment",
      description: "Start before you're ready. $10 in index fund today > $10,000 next year. Time in market > timing market.",
      actions: ["Download brokerage app or use mobile money investment", "Invest $10 in global index fund (or save in envelope labeled INVEST)", "Set auto invest $5/week, never cancel"],
      videoId: "TJDcGv9OH4Q",
      reflection: "What excuse kept you from investing earlier?",
      reward: "Investor Day 1"
    },
    {
      title: "Give First, Ask Later — 3 Intros",
      category: "Network",
      description: "Adam Grant proved givers win. Introduce two people who should know each other — no ask. Do it 3 times.",
      actions: ["Open contacts, find 2 people in same industry who don't know each other", "Write intro message explaining why they should meet", "Send intro, follow up after 3 days"],
      videoId: "rrkrvAUbU9Y",
      reflection: "What generosity can become system next week?",
      reward: "Connector Badge"
    },
    {
      title: "Deep Work — 90 Mins No Phone",
      category: "Skills",
      description: "Billionaires protect mornings. 90 mins deep work on income-generating skill today. Phone in other room.",
      actions: ["Pick MIT: Most Important Task for income (sales page, code, design)", "Timer 90 mins, phone off, door closed", "At end, write what difficulty you hit — that's skill gap to close"],
      videoId: "H14bBuluwB8",
      reflection: "What distracted you? Remove it tomorrow.",
      reward: "Deep Work Badge"
    }
  ];

  const challenges: DailyChallenge[] = [];
  for (let day = 1; day <= 365; day++) {
    const tmpl = templates[(day - 1) % templates.length];
    const q = quotes[(day - 1) % quotes.length];
    const week = Math.floor((day - 1) / 7);
    const diff: ChallengeDifficulty[] = ["Starter", "Builder", "Warrior", "Billionaire"];
    // ramp difficulty
    let difficulty: ChallengeDifficulty = diff[Math.min(3, Math.floor(week / 13))];
    if (day <= 30) difficulty = "Starter";
    else if (day <= 90) difficulty = "Builder";
    else if (day <= 180) difficulty = "Warrior";
    else difficulty = "Billionaire";

    const points = difficulty === "Starter" ? 10 : difficulty === "Builder" ? 25 : difficulty === "Warrior" ? 50 : 100;
    const time = difficulty === "Starter" ? 15 : difficulty === "Builder" ? 30 : difficulty === "Warrior" ? 60 : 90;

    challenges.push({
      day,
      title: day <= templates.length ? tmpl.title : `Day ${day}: ${tmpl.title} — Level ${difficulty}`,
      category: tmpl.category,
      difficulty,
      description: tmpl.description,
      actions: tmpl.actions,
      timeMinutes: time,
      points,
      quote: q.q,
      quoteAuthor: q.a,
      videoId: tmpl.videoId,
      reflection: tmpl.reflection,
      reward: `${tmpl.reward} • Day ${day}`
    });
  }

  // Override first 14 days with handcrafted cinematic journey
  const cinematicFirst14: Partial<DailyChallenge>[] = [
    { title: "Day 1: The Billionaire's Mirror — Who Must You Become?", category: "Mindset", description: "Before wealth, identity. Billionaires don't set goals, they become someone who achieves them. Today, write obituary you want at 90.", actions: ["Write 1-paragraph obituary: what empire, family, impact", "List 3 habits billionaire-you does daily that current-you doesn't", "Do 1 habit today for 15 minutes"], reflection: "Who must you become to earn 10x? What must you quit?", reward: "Identity Shift — Film Reel Opens 🎬" },
    { title: "Day 2: The Cash Flow Truth", category: "Money", description: "Warren Buffett's first ledger at age 8. Today you start yours. Track every kwacha/dollar for next 30 days.", actions: ["Create simple sheet: Date | In | Out | Asset or Liability?", "Categorize yesterday's spending — how much to assets?", "Cut one liability subscription today"], reflection: "What % of income goes to assets that pay you while you sleep?", reward: "Clarity Over Comfort" },
    { title: "Day 3: The Dangote Road — Start in Traffic", category: "Business", description: "Dangote sold sugar in Lagos traffic. No license, no shop. Start where you are. Your first customer is within 24 hours.", actions: ["List skills you can sell in 24h for cash (writing, design, tutoring, errands)", "DM 10 people offer: $20 quick win", "Deliver even if profit tiny — collect testimonial"], reflection: "What market proof did you get today?", reward: "Hustle Heat" },
    { title: "Day 4: Strive's 5-Year No — Your Law School", category: "Mindset", description: "When government said no to telecom for 5 years, Strive studied law and won. Your current no is university.", actions: ["Write down biggest rejection this month", "Search case study of someone who turned same rejection into win", "Write 3 lessons rejection taught you"], reflection: "If rejection = redirect, where is it redirecting you?", reward: "Resilience Reel" },
    { title: "Day 5: Build AI Before Coffee", category: "AI", description: "One AI tool that replaces $500/month worker. Today you build it. No code needed.", actions: ["Pick hated task: email reply, social captions, invoice", "Go to ChatGPT/Claude, prompt: automate this task, give workflow", "Build workflow and test 3 times"], reflection: "What job did you just automate? What's next?", reward: "AI Apprentice 🤖" },
    { title: "Day 6: The $1,000 School Brick", category: "Investment", description: "Invest in something that outlives you — even $10. Seedwel STEM school brick = physical asset + tuition yield + impact. Visualize your name on building.", actions: ["View investment gallery (/invest) and watch construction footage", "Write why school building = forever asset: land + tuition + jobs", "Simulate $1000 school invest at 16% yield = how much in 10 years?"], reflection: "What legacy asset do you want your investment to build?", reward: "Legacy Builder" },
    { title: "Day 7: Sunday Review — Week 1 Film", category: "Mindset", description: "Movies have dailies. Billionaires have weekly review. 30 mins today to cut what didn't work, double what did.", actions: ["Score each day 1-10 on action taken", "List 3 wins, 1 failure and lesson", "Plan Week 2 with one harder asymmetric bet"], reflection: "What would Day 30 you tell Day 1 you?", reward: "Director's Cut — Week 1 Complete 🎥" },
    { title: "Day 8: The Oprah Ownership", category: "Business", description: "Oprah got fired then owned everything. Ownership beats salary by 100x. Turn one skill into ownable asset today.", actions: ["Convert consult hours into product: template, checklist, course outline", "Name product, price 3x hourly equivalent", "Post product, not service"], reflection: "What did you own today that pays while you sleep?", reward: "Ownership Flip" },
    { title: "Day 9: Buffet's 20-Slot Punch Card", category: "Investment", description: "Buffett says you only get 20 investments in life. Forces focus. Today you kill 9/10 ideas and keep one.", actions: ["List 10 business/ideas you considered", "Score each on passion 1-10, market size, your edge. Cross 9 lowest", "Write one-page plan for keeper — 30-day validation sprint"], reflection: "Why is keeper the one?", reward: "Focus Laser" },
    { title: "Day 10: Tony's $100M Give", category: "Network", description: "Elumelu gave $100M to 10,000 founders. Givers network is Tesla autopilot. Gift without expectation today.", actions: ["Pick 3 young entrepreneurs you know", "Give 30-min mentoring, intro, or resource each", "No ask back. Note how it felt"], reflection: "What luck are you creating for others?", reward: "Africapitalist Spirit" },
    { title: "Day 11: Mo's Living Room Studio", category: "Skills", description: "Mo started talk show in living room. Your studio is phone camera today. Record first 3-min lesson/teaching.", actions: ["Record 3-min vertical video teaching one skill you know", "Post to WhatsApp Status + TikTok + YouTube Short", "Reply to every comment within 2 hours"], reflection: "What objection did camera trigger? Do next video tomorrow anyway.", reward: "Camera Confidence Lens" },
    { title: "Day 12: Real Estate — 1% Rule in Lusaka", category: "Investment", description: "Real estate: look at one property online, run 1% rule math. Does monthly rent ≈ 1% price? Cash-on-cash?", actions: ["Browse property site Zambia, pick one listing", "Compute 1% rule, annual cash flow", "Would you house-hack living in one unit?"], reflection: "What numbers make deal work? What kills it?", reward: "Deal Eyes" },
    { title: "Day 13: Failure Debrief — 48hr Rule", category: "Mindset", description: "Billionaires debrief failure in 48 hours while memory fresh. Your last failure — open it.", actions: ["Pick last business failure, write timeline of what happened", "Extract 3 lessons, write what you'd do differently now", "Share one lesson publicly — vulnerability builds trust"], reflection: "What tuition did failure charge you? Was it worth degree?", reward: "Failure = Fuel ⛽" },
    { title: "Day 14: Week 2 Premiere — Investor Pitch Practice", category: "Business", description: "Two-week premiere. Today you pitch your 30-day business to camera as if Seedwel investor panel.", actions: ["Write 2-min pitch: problem, solution, traction week 1-2, ask", "Record pitch video, watch back 3x, improve hook", "Send pitch to 1 mentor for feedback"], reflection: "If investor said yes for $1000, what would you do day 15-30?", reward: "Premiere Ready — 2 Weeks Done 🎬" },
  ];

  cinematicFirst14.forEach((override, idx) => {
    challenges[idx] = { ...challenges[idx], ...override } as DailyChallenge;
  });

  return challenges;
}

export const challenges365 = generateYear();

export function getChallenge(day: number): DailyChallenge | undefined {
  return challenges365.find(c => c.day === day);
}

export function getChallengesForWeek(week: number): DailyChallenge[] {
  return challenges365.filter(c => Math.floor((c.day - 1) / 7) + 1 === week);
}

export function currentDayFromStart(startDateISO: string): number {
  const start = new Date(startDateISO);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(365, diff));
}
