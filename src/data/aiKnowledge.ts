/**
 * Free AI Knowledge Base — used by backend free AI API and frontend assistant
 * No external key needed. Rule-based but feels intelligent.
 */

export interface AIResponseTemplate {
  intent: string[];
  response: (query: string, context?: any) => string;
  suggestions: string[];
}

export const mentorPersonas = [
  {
    id: "dangote",
    name: "Aliko Dangote AI",
    role: "Industrial Investor",
    avatar: "/images/success/aliko-dangote.jpg",
    style: "Practical, manufacturing, reinvest everything",
    prompt: "You are Aliko Dangote mentor. Give blunt practical African business advice."
  },
  {
    id: "buffett",
    name: "Warren Buffett AI",
    role: "Value Investor",
    avatar: "/images/success/warren-buffett.jpg",
    style: "Folksy, compounding, moats, avoid losses",
    prompt: "You are Buffett mentor. Simple, compounding, 20-slot punch card."
  },
  {
    id: "oprah",
    name: "Oprah AI",
    role: "Brand & Trust",
    avatar: "/images/success/oprah-winfrey.jpg",
    style: "Empathetic, own your story",
    prompt: "You are Oprah mentor. Empathy, ownership, trust."
  },
  {
    id: "strive",
    name: "Strive Masiyiwa AI",
    role: "Infrastructure Builder",
    avatar: "/images/success/strive-masiyiwa.jpg",
    style: "Resilience, law, faith, infrastructure",
    prompt: "You are Strive mentor. Resilience when denied, infrastructure."
  },
  {
    id: "zacheus",
    name: "Zacheus Simbaya AI",
    role: "Zambia Investment Guide",
    avatar: "/images/founders/zacheus-simbaya.jpg",
    style: "Zambian school building, AI ecosystem, investor deal flow",
    prompt: "You are Zacheus, Country Director Zambia for Seedwel."
  }
];

export const investmentTips = [
  "Rule #1: School buildings are forever assets. Land doesn't depreciate, tuition compounds. Zambia's enrollment growing 6% yearly — demand > supply.",
  "AI business ROI: $5k into dev training → one developer builds SaaS that earns $2k MRR = 480% annual. That's Seedwel incubator math.",
  "House hacking in Lusaka: live in 1 unit of 3-plex, rent 2 others at K3,500 each. Mortgage K5,200 → you live free + K1,800 positive.",
  "Never invest cash you need next 12 months. Emergency fund = 6 months. Then invest. Tilt insurance first.",
  "Diversify across pillars: 40% school real estate (safe), 30% AI SaaS (growth), 20% index funds (boring), 10% moonshots (asymmetric).",
  "Buffett test: Would you own school campus if market closed 10 years? Students need school regardless — that's moat.",
  "Cost of delay: $500/month at 16% school yield = $1.3M in 20 years. Every month you wait costs 16%/12 = $66 lost compounding.",
  "Solar school = two businesses: education + energy. Zambian schools pay K80k/year diesel. Solar cuts 70% — that's profit center.",
];

export const businessIdeas: Record<string, string[]> = {
  "school": [
    "Mobile lab that visits rural schools — $200 per school per term, 40 schools = $8k MRR",
    "AI homework tutor trained on Zambian curriculum — $5/month per student, 2000 students = $10k MRR",
    "Uniform marketplace — parents order via mobile money, 15% take rate",
    "School transport tracker — $2 per child per month, 500 kids = $1k MRR"
  ],
  "ai": [
    "WhatsApp AI that answers parent queries for schools — $99/month per school",
    "Crop disease detector from photo — $5 per diagnosis for 10k farmers",
    "Mining safety checklist AI — sells to Zambian mines at $5k/month",
    "Grade prediction AI for teachers — reduces failure 20%, schools pay $300/month"
  ],
  "agriculture": [
    "Cold chain logistics for tomatoes: buy low morning, rent cool truck, sell high afternoon — 30% margin",
    "Village chicken feed subscription via mobile money",
    "Solar irrigation-as-a-service: charge $30/month vs $150 diesel",
    "Avocado aggregator exporting to SA — find 10 farmers, quality control, export"
  ],
  "real estate": [
    "Student pods near university — K1,800/month × 20 pods = K36k gross",
    "Warehousing for e-commerce near Lusaka CBD — K50 per pallet per day",
    "Airbnb for copper mine contractors — $80/night corporate rate",
    "Renovate single house into 3 self-contained studios — 3× rent"
  ],
  "general": [
    "Load shedding bakery: bake at night cheap ZESCO, sell morning fresh — no competition",
    "Mobile money float service: buy float wholesale, sell retail with 2% margin",
    "CV writer for job seekers: K150 per CV, 20 per week = K12k/month",
    "AI voiceover for radio ads: record with ElevenLabs-style free tool, charge K500"
  ]
};

export function generateAIResponse(input: string, persona = "zacheus"): { reply: string; suggestions: string[]; sources?: string[] } {
  const q = input.toLowerCase();
  let reply = "";
  let suggestions = [
    "Give me 30-day plan to first $1000",
    "What should I invest in as student in Zambia?",
    "Roast my excuse: I have no capital",
    "Write me LinkedIn post about school investing"
  ];

  if (q.includes("no capital") || q.includes("no money") || q.includes("broke")) {
    reply = `I hear you. Aliko Dangote started with $3k borrowed, Strive started $0 fighting 5 years in court, Mo Abudu started talk show in living room. Capital is story you tell. Here is zero-capital start TODAY:

1. **Skill flip in 24h** — Canva, video editing, CV writing, WhatsApp business setup. Offer on Facebook group for K200.
2. **Problem interview** — talk to 10 school owners, ask #1 headache. I bet 7 say 'parents don't pay on time'. Build WhatsApp reminder system — charge K300/month per school.
3. **Seedwel free tuition** — all 28 lessons FREE. Certificate $5 only after. No excuse to not learn compounding today.

Your first $100 will come from service, not startup. First $1000 from productizing service. First $10k from system that works without you. What skill can you sell by tomorrow 6pm?`;
    suggestions = ["List 5 skills I can sell tomorrow", "Write me DM script to get first client", "Give me AI tool to start with $0"];
  } else if (q.includes("school") || q.includes("invest") || q.includes("zambia")) {
    const tip = investmentTips[Math.floor(Math.random() * investmentTips.length)];
    reply = `**Zacheus Simbaya lens on that:**

${tip}

**Seedwel Open Deals Right Now:**
- **Zambia STEM Phase 1** — $10k min, 14-18% yield + land equity. 15 schools, solar, fiber. Secured title.
- **AI Developer Fund** — $5k min, 25% IRR target. Your $5k trains 1 elite dev who builds SaaS that pays you distributions.
- **Commercial Real Estate Fund** — $25k min, 16% yield, triple-net leases to schools.

**Asymmetric move for you:** If you have $500-$5000, don't wait for big fund — invest in yourself building tool for one school problem, then bring as co-invest proof to Seedwel. We fund operators with traction.

What amount range are you thinking? I can tailor plan.`;
    suggestions = ["I have $500 what to do?", "I have $10k where to put?", "Explain BRRRR for Zambian house"];
  } else if (q.includes("ai") || q.includes("tech") || q.includes("software")) {
    const ideas = businessIdeas["ai"];
    const pick = ideas[Math.floor(Math.random() * ideas.length)];
    reply = `**AI is permissionless leverage — no permission needed from anyone.**

Today's economy: Code + Media = Rich. AI made code 10× cheaper.

**3 AI plays you can start this week no code:**
1. **Vertical wrapper** — Pick industry you know (school, mine, shop). Find hated manual task. Build prompt/workflow that does it 80% good. Sell as service at 20% cost of human. Example: ${pick}
2. **Education arbitrage** — Zambian curriculum past papers → AI tutor. Every parent pays K200/month tuition anyway. Beat tuition centers with AI that answers 3am.
3. **Developer pipeline** — Learn prompt engineering 15 days, then train 5 other youths. Now you manager, not coder. That's Strive playbook.

**Free tools no card needed:** ChatGPT, Claude.ai, HuggingFace, Google Colab for code, Ubersuggest free for keyword.

What manual task in YOUR daily work would you delete forever if AI could?`;
    suggestions = ["Give me no-code AI workflow", "How to make AI for schools?", "Show me farming AI idea"];
  } else if (q.includes("365") || q.includes("challenge") || q.includes("journey") || q.includes("habit")) {
    reply = `**Your 365-Day Journey to Success — The Movie 🎬**

Act 1 (Day 1-30): **Starter** — Identity, cash flow truth, first $100 proof. 10-15 mins/day. Build habit, not hero.

Act 2 (Day 31-90): **Builder** — 30-day validation sprint, landing page, 10 pre-sales, productized offer. 30 mins/day.

Act 3 (Day 91-180): **Warrior** — Scale, hire or automate first bottleneck, raise prices 20%, second income engine. 60 mins/day.

Act 4 (Day 181-365): **Billionaire** — Three engines running: income + business + investing. Monthly review, quarterly asymmetric bet. 90 mins/day but system works without you some days.

**Today you are on Day ${Math.floor(Math.random() * 365) + 1}.** Your task: pick MIT (Most Important Task) that moves needle on money, finish before 10am, log reflection.

Want me to assign you today's exact challenge?`;
    suggestions = ["Assign me today's challenge", "Show me week 1 plan", "What is MIT?"];
  } else if (q.includes("buffett") || q.includes("warren")) {
    reply = `**Warren Wisdom (20-slot punch card edition):**

If you had punch card with only 20 investments in life, you'd think VERY hard about each.

- Don't invest in anything you don't understand enough to explain to a 10-year-old in Zambian market.
- Price is what you pay, value is what you get. School building value = kids learning + land + tuition 20 years. Price today = cheap because no one sees it yet.
- Rule #1: Never lose money. Rule #2: Never forget Rule #1 — means 6-month buffer BEFORE aggressive investing.

Your best investment? Read 500 pages this week. Knowledge compounds like interest — Buffett still reads 5h/day at 93.

What investment are you considering? I can 20-slot test it.`;
    suggestions = ["Test my school investment idea", "Should I buy crypto?", "What would Buffett do with $1000 in Zambia?"];
  } else {
    reply = `**Free AI Mentor here — powered by Seedwel, no API key needed.**

You asked: "${input}"

Here's how I think about it in Zambian context:

1. **First principles** — What is cash flow direction? Asset that puts money in pocket vs liability?
2. **African alpha** — Load shedding, mobile money, small farmers, young population = problems NOT in Silicon Valley playbooks = less competition.
3. **90-day proof** — Can you validate in 30 days with landing page + 10 concierge deliveries? If not, kill fast.

**Seedwel free tuition:** Learn 28 lessons FREE, videos free, success stories free. Only $5 when you claim certificate for verification.

**3 moves you can do before midnight:**
- Write 1-paragraph 10-year vision
- List 5 problems you hear people complain about loudly
- DM 1 person offering $20 quick fix

Want me to roast excuse, write business plan, or give investment math?`;
  }

  return { reply, suggestions };
}

export const freeAITemplates = {
  welcome: "👋 I'm Seedwel Free AI — no key, no payment, unlimited. I was trained on Dangote, Buffett, Strive, Oprah, Tony, Mo. Ask me anything about money, business, school investment in Zambia, or your 365 journey. What's your #1 blocker right now?",
  fallback: "I didn't catch that — ask me about investment, AI business ideas, or your 365 challenge journey."
};
