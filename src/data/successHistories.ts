/**
 * Expanded Success Histories — detailed timelines, struggles, investment lessons
 */

export interface HistoryMilestone {
  year: string;
  title: string;
  description: string;
  lesson: string;
  icon: string;
}

export interface ExpandedHistory {
  id: string;
  name: string;
  country: string;
  photo: string;
  netWorth: string;
  industry: string;
  tagline: string;
  earlyStruggle: string;
  breakthroughMoment: string;
  investmentPhilosophy: string;
  milestones: HistoryMilestone[];
  lessons: string[];
  wealthJourney: { age: string; event: string; amount: string }[];
  quote: string;
  movieTitle: string;
  color: string;
}

export const expandedHistories: ExpandedHistory[] = [
  {
    id: "aliko-dangote",
    name: "Aliko Dangote",
    country: "Nigeria",
    photo: "/images/success/aliko-dangote.jpg",
    netWorth: "$10B+",
    industry: "Industry & Manufacturing",
    tagline: "From small trading loan to Africa's Industrial King",
    earlyStruggle: "Born into a modest merchant family in Kano, 1957. Started selling sweets in primary school. At 21, got $3,000 loan from uncle to start trading rice, sugar, cement from Lagos traffic jam stalls. Lagos was chaos — 18-hour days, police harassment, cement theft by drivers. Lost first two full loads.",
    breakthroughMoment: "1999: Nigeria switched to democracy. Dangote invested entire profits into cement manufacturing when everyone else was importing. Government banned cement imports — his factories became national infrastructure. Built 52,000-barrel refinery — largest in Africa.",
    investmentPhilosophy: "Build what Africa imports. Reinvest 100% for first 15 years. Control production, distribution, price.",
    milestones: [
      { year: "1978", title: "Uncle's Loan", description: "Started Dangote Trading with $3,000 loan, 3 staff in Lagos", lesson: "Start with borrowed trust, repay with results", icon: "💰" },
      { year: "1981", title: "First Big Loss", description: "Two trucks of rice seized by customs, lost everything", lesson: "Regulation is data, not defeat", icon: "⚡" },
      { year: "1999", title: "Cement Factory Gamble", description: "Invested $25M in cement factory when import was easier", lesson: "Do hard things when everyone takes easy path", icon: "🏭" },
      { year: "2007", title: "Stock Market Peak", description: "Dangote Cement becomes most valuable stock in Nigeria", lesson: "Public markets reward long manufacturing bets", icon: "📈" },
      { year: "2023", title: "$19B Refinery", description: "650,000 bpd refinery opens, Nigeria stops importing fuel", lesson: "Nation-building is the ultimate moat", icon: "⛽" }
    ],
    lessons: ["School building = nation building — same playbook", "Cement = infrastructure = permanent demand", "Zambia needs own Dangote in schools & AI"],
    wealthJourney: [
      { age: "Age 21", event: "Started trading", amount: "$3k loan" },
      { age: "Age 30", event: "Trading to millions", amount: "$10M+" },
      { age: "Age 45", event: "Cement IPO", amount: "$1B" },
      { age: "Age 65", event: "Refinery + diversified", amount: "$10B+" }
    ],
    quote: "Nothing comes easy; you have to work for it.",
    movieTitle: "The Cement Empire — How He Built Africa's Factory",
    color: "from-amber-400 to-yellow-600"
  },
  {
    id: "strive-masiyiwa",
    name: "Strive Masiyiwa",
    country: "Zimbabwe",
    photo: "/images/success/strive-masiyiwa.jpg",
    netWorth: "$1B+",
    industry: "Telecom & Technology",
    tagline: "Rejected 5 years, then connected 100M Africans",
    earlyStruggle: "Civil engineer returning from UK, 1993. Applied for telecom license — government said no, gave monopoly to state telco. Fought 5-year legal battle in courts, death threats, investors withdrew. Lived on savings, wife sold jewelry.",
    breakthroughMoment: "1998: Supreme Court ruled monopoly unconstitutional. Within 2 years Econet had 1M subscribers. Used same infrastructure playbook: own towers, own fiber, own payment. Cassava platform now bigger than telecom.",
    investmentPhilosophy: "Infrastructure that multiplies human dignity. Fiber + payment + education.",
    milestones: [
      { year: "1993", title: "License Denied", description: "Government denies private telecom license", lesson: "Rejection is redirect to law", icon: "🚫" },
      { year: "1998", title: "Won in Court", description: "Supreme Court victory ends monopoly", lesson: "Courts protect builders", icon: "⚖️" },
      { year: "2000", title: "1M Subscribers", description: "Econet fastest growth telecom in Africa", lesson: "Speed after permission", icon: "📱" },
      { year: "2015", title: "EcoCash Dominance", description: "Mobile money 80% market share", lesson: "Own payments = own economy", icon: "💳" },
      { year: "2020", title: "Cassava Tech", description: "Data centers, AI, solar across 20 countries", lesson: "Stack infrastructure", icon: "🌍" }
    ],
    lessons: ["Your 'no' today is case law for next founder", "Infrastructure investing = longest moat", "Mentorship is investment — he teaches 6M on Facebook"],
    wealthJourney: [
      { age: "Age 33", event: "First license fight", amount: "$0" },
      { age: "Age 38", event: "Econet license", amount: "$5M" },
      { age: "Age 50", event: "Pan-African operator", amount: "$500M" },
      { age: "Age 60", event: "Cassava + Liquid", amount: "$1B+" }
    ],
    quote: "You don't need money to start a business. You need an idea and the will to work.",
    movieTitle: "The Signal — 5 Years of No That Built a Continent",
    color: "from-sky-400 to-blue-600"
  },
  {
    id: "oprah-winfrey",
    name: "Oprah Winfrey",
    country: "United States",
    photo: "/images/success/oprah-winfrey.jpg",
    netWorth: "$2.5B+",
    industry: "Media & Entrepreneurship",
    tagline: "Told not TV material, became most trusted woman on TV",
    earlyStruggle: "Born to teenage mother in rural Mississippi, 1954. Poverty, abuse, teenage pregnancy. Fired from first TV job as anchor: 'too emotional'. Breakup destroyed her, gained 30 pounds on air.",
    breakthroughMoment: "1986: Took low-rated Chicago AM talk show at 8am, made it #1 in months by doing opposite of everyone — vulnerability, not sensationalism. Owned her show, then own network OWN, own magazine. Own = billionaire.",
    investmentPhilosophy: "Own your story, own distribution, own empathy. Audience trust = only asset that compounds after every failure.",
    milestones: [
      { year: "1976", title: "Fired from TV", description: "Baltimore anchor fired for being too emotional", lesson: "Weakness reframed = superpower", icon: "💔" },
      { year: "1986", title: "AM Chicago to #1", description: "Took over dead slot, made #1 with vulnerability", lesson: "Empathy > polish", icon: "🎤" },
      { year: "1990", title: "Own Production", description: "First Black woman to produce own show — owns 100%", lesson: "Own IP, not salary", icon: "🏆" },
      { year: "2011", title: "OWN Network", description: "Launched own 24/7 network despite debt", lesson: "Distribution is final moat", icon: "📺" },
      { year: "2020", title: "WW Investor", description: "$70M investment in Weight Watchers, stock triples", lesson: "Trust equity invests", icon: "📈" }
    ],
    lessons: ["Failure resume = credibility resume", "Own your content before you rent audience", "Brand = trust balance sheet"],
    wealthJourney: [
      { age: "Age 22", event: "Fired anchor", amount: "$22k/yr" },
      { age: "Age 32", event: "Oprah Show syndicated", amount: "$50M/yr" },
      { age: "Age 45", event: "Harpo + magazine", amount: "$500M" },
      { age: "Age 65", event: "OWN + WW", amount: "$2.5B+" }
    ],
    quote: "Think like a queen. A queen is not afraid to fail.",
    movieTitle: "Own — How 'Too Emotional' Became Empathy Empire",
    color: "from-fuchsia-400 to-pink-600"
  },
  {
    id: "tony-elumelu",
    name: "Tony Elumelu",
    country: "Nigeria",
    photo: "/images/success/tony-elumelu.jpg",
    netWorth: "$1B+",
    industry: "Banking & Investment",
    tagline: "Turned failing bank into $10B group, then funded 20,000 founders",
    earlyStruggle: "Joined Allstates Trust Bank as corp finance rookie, 1985. Seen as too young. 1997 took over Standard Trust Bank that was near collapse — 5 branches, broke balance sheet. Bankers laughed: 'he will fail in 6 months'.",
    breakthroughMoment: "2005 merged with UBA creating largest financial services group in Africa at time. But true breakthrough: 2010 launched Tony Elumelu Foundation — $100M to fund 10,000 African entrepreneurs. Concept: Africapitalism — private sector must do well AND do good.",
    investmentPhilosophy: "Luck is preparation + opportunity. Spread luck by funding others. Economic empowerment = security.",
    milestones: [
      { year: "1997", title: "Turnaround CEO", description: "Takes over broke bank", lesson: "Distress = cheap entry", icon: "🏦" },
      { year: "2005", title: "UBA Merge", description: "Creates $10B pan-African bank", lesson: "Merge to leapfrog", icon: "🤝" },
      { year: "2010", title: "Africapitalism", description: "Coins word, writes manifesto", lesson: "Narrative is infrastructure", icon: "📖" },
      { year: "2015", title: "$100M TEF", description: "Funds first 1,000 founders $5k each", lesson: "Seed many to harvest legend", icon: "🌱" },
      { year: "2024", title: "20k+ Alumni", description: "Foundation alumni generate 400k+ jobs", lesson: "Giving is compounding portfolio", icon: "🌍" }
    ],
    lessons: ["Banking + seed funding = same skill — risk pricing", "Africapitalism = Seedwel thesis — investment + impact", "Mentorship scales wealth faster than interest"],
    wealthJourney: [
      { age: "Age 34", event: "Took over broke bank", amount: "Distress asset" },
      { age: "Age 42", event: "UBA Group CEO", amount: "$100M+" },
      { age: "Age 50", event: "Heirs Holdings", amount: "$500M" },
      { age: "Age 61", event: "TEF + Heirs", amount: "$1B+ + 20k founders" }
    ],
    quote: "The private sector must take the lead in transforming Africa.",
    movieTitle: "Africapitalism — Banking the Unbanked, Funding the Unfunded",
    color: "from-emerald-400 to-teal-600"
  },
  {
    id: "warren-buffett",
    name: "Warren Buffett",
    country: "United States",
    photo: "/images/success/warren-buffett.jpg",
    netWorth: "$150B+",
    industry: "Investing",
    tagline: "Read 600 pages a day, compound 60 years, give away 99%",
    earlyStruggle: "Born 1930 Omaha. Started pinball machines in barbershop at 13, sold business for $1,200. Rejected from Harvard Business School. 1952 applied to work for idol Ben Graham — Graham rejected him. Had to work door-to-door selling securities.",
    breakthroughMoment: "1965 took control of failing textile mill Berkshire Hathaway at $12/share — worst deal by his own admission. Used textile cashflow to buy insurance float — free money to invest. Never sold a single share of Berkshire. 1965 $12 -> 2024 $550,000 per share.",
    investmentPhilosophy: "Rule #1: Don't lose money. Rule #2: Don't forget Rule #1. Price is what you pay, value is what you get. Be fearful when others greedy.",
    milestones: [
      { year: "1942", title: "First Stock at 11", description: "Bought 3 shares Cities Service at $38", lesson: "Start at 11, compound at 90", icon: "📚" },
      { year: "1952", title: "Rejected by Graham", description: "Idol says no job", lesson: "Work free to learn from best", icon: "🚪" },
      { year: "1965", title: "Berkshire Textile", description: "Buys failing mill", lesson: "Vehicle matters less than engine", icon: "🏭" },
      { year: "1988", title: "Coca-Cola $1B", description: "Invests $1B in Coke, holds 35+ years", lesson: "Time is moat", icon: "🥤" },
      { year: "2010", title: "Giving Pledge", description: "Pledges 99% to Gates Foundation", lesson: "Wealth = stewardship", icon: "❤️" }
    ],
    lessons: ["Compound 60 years > genius 10 years", "Seedwel $5 cert = Graham-style intrinsic value", "Read 5 hours daily is his edge — teach that"],
    wealthJourney: [
      { age: "Age 11", event: "First stock", amount: "$114" },
      { age: "Age 30", event: "First million", amount: "$1M" },
      { age: "Age 55", event: "Billionaire", amount: "$1B" },
      { age: "Age 90", event: "Oracle of Omaha", amount: "$100B+" }
    ],
    quote: "The best investment you can make is in yourself.",
    movieTitle: "The Compound — 60 Years of Berkshire",
    color: "from-violet-400 to-purple-600"
  },
  {
    id: "mo-abudu",
    name: "Mo Abudu",
    country: "Nigeria",
    photo: "/images/success/mo-abudu.jpg",
    netWorth: "$100M+",
    industry: "Media",
    tagline: "Corporate exec to talk show to Netflix deal — second act > first",
    earlyStruggle: "12-year career at ExxonMobil, safe salary. Quit at 40 to start talk show Moments with Mo in studio in her living room. Banks said 'no media will work in Africa'. First 2 years zero sponsors, self-funded from savings.",
    breakthroughMoment: "2013 launched EbonyLife TV — first global Black entertainment network. 2018 Netflix licensed her entire catalogue — first African creator to do so. Sony Pictures signed 3-movie deal. Proved African stories = global economics.",
    investmentPhilosophy: "Own narrative infrastructure — channels, not just shows. African excellence is not niche, it's market.",
    milestones: [
      { year: "2006", title: "Quit Oil Job", description: "Leaves ExxonMobil", lesson: "Safe salary = risk", icon: "🛢️" },
      { year: "2008", title: "Living-Room Studio", description: "Self-funds talk show", lesson: "Start ugly, start today", icon: "🎙️" },
      { year: "2013", title: "EbonyLife TV", description: "Launches network on DStv", lesson: "Channel > show", icon: "📺" },
      { year: "2018", title: "Netflix Deal", description: "First African overall deal", lesson: "Local to global pipeline works", icon: "🌍" },
      { year: "2021", title: "Sony Pictures", description: "Multi-title production deal", lesson: "Global validates local", icon: "🎬" }
    ],
    lessons: ["Corporate to creator = asymmetric bet", "Media = most permissionless leverage in Africa now", "Seedwel videos same playbook — own channel"],
    wealthJourney: [
      { age: "Age 40", event: "Quit corporate", amount: "$0 savings draining" },
      { age: "Age 45", event: "Talk show hits", amount: "$500k revenue" },
      { age: "Age 50", event: "Network launched", amount: "$5M" },
      { age: "Age 58", event: "Netflix + Sony", amount: "$100M+" }
    ],
    quote: "Don't wait for permission to tell your own story.",
    movieTitle: "EbonyLife — From Living Room to Netflix",
    color: "from-pink-400 to-rose-600"
  }
];
