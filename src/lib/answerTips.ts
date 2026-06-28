// PitchNest Answer-Tips Library — Africa-first
//
// A static, in-memory coaching library used by the live pitch room's "Tip Card"
// layer. When a panelist finishes asking a question, the client keyword-matches
// the question text against this library and shows the matching card.
//
// HARD RULES (keep these when expanding the library):
//  • Tips give DIRECTION, never a model answer. Never write a sample answer the
//    founder could read aloud — it pollutes scoring and defeats the training
//    purpose. "Explain how you acquire customers and what each costs" is good;
//    "Say: our CAC is $40" is forbidden.
//  • Africa-first framing: lean on agent networks, mobile money, telcos,
//    distributors and informal channels. Keep currency references neutral /
//    multi-currency ("naira/cedi/shilling" or "per customer").
//
// This module makes NO network calls and never throws on bad input — a mismatch
// returns the generic fallback card.

export interface AnswerTip {
  /** Short concept label shown as the card heading. */
  term: string;
  /** One-line plain-language definition of the concept. */
  definition: string;
  /** Direction-only hint on what to talk about (never a model answer). */
  tip: string;
  /** Lowercase, word-boundary regexes that map a question to this card. */
  patterns: RegExp[];
}

// Ordered most-specific → least-specific so multi-word/compound concepts win
// over the single ambiguous terms they contain (e.g. "unit economics" before a
// bare "margin", "gross margin" before generic words).
export const ANSWER_TIPS: AnswerTip[] = [
  {
    term: "Unit economics",
    definition:
      "Whether each customer or transaction makes or loses you money.",
    tip: "Show that the money from one customer beats the cost to serve and acquire them.",
    patterns: [/unit economics/],
  },
  {
    term: "CAC",
    definition:
      "Customer Acquisition Cost — what it costs to win one paying customer.",
    tip: "Explain how you reach customers (agents, referrals, WhatsApp, field sales) and roughly what each one costs.",
    patterns: [/\bcac\b/, /customer acquisition cost/, /acquisition cost/, /cost to acquire/],
  },
  {
    term: "LTV",
    definition: "Lifetime Value — total revenue one customer brings over time.",
    tip: "Talk about how long customers stay and what they pay over that period.",
    patterns: [/\bltv\b/, /lifetime value/],
  },
  {
    term: "TAM / SAM / SOM",
    definition:
      "Your total market, the part you can realistically serve, and the slice you'll capture first.",
    tip: "Build it bottom-up from real numbers, not '1% of a billion people'. Name your starting market or country.",
    patterns: [
      /\btam\b/,
      /\bsam\b/,
      /\bsom\b/,
      /addressable market/,
      /total addressable/,
      /serviceable/,
      /market size/,
      /how big.{0,15}market/,
    ],
  },
  {
    term: "Churn",
    definition: "The rate at which customers stop using or paying.",
    tip: "Share how many customers stay versus leave each month, and why they'd stick with you.",
    patterns: [/\bchurn\b/],
  },
  {
    term: "Retention",
    definition: "How many customers keep coming back over time.",
    tip: "Talk about repeat usage or repeat purchase — proof people don't just try you once.",
    patterns: [/\bretention\b/, /\bretain\b/, /come back/, /repeat (usage|purchase|customers)/],
  },
  {
    term: "Burn rate",
    definition: "How much cash your business spends each month.",
    tip: "State your monthly spend and be honest about where the money goes.",
    patterns: [/burn rate/, /\bburn\b/, /monthly spend/],
  },
  {
    term: "Runway",
    definition: "How many months of cash you have left at your current spend.",
    tip: "Say how long your funds last, and what this raise extends it to.",
    patterns: [/\brunway\b/],
  },
  {
    term: "Moat",
    definition: "What stops competitors or big players from copying you.",
    tip: "Explain what's hard to replicate — your distribution, local data, trust, partnerships, or network.",
    patterns: [/\bmoat\b/],
  },
  {
    term: "Defensibility",
    definition: "Why you'll stay ahead as others enter.",
    tip: "Talk about what compounds over time — data, brand trust, switching costs, or locked-in distribution.",
    patterns: [/defensib/, /defensible/, /what stops.{0,20}(competitor|copy)/, /barrier to entry/],
  },
  {
    term: "Network effects",
    definition: "When your product gets more valuable as more people use it.",
    tip: "Explain whether each new user makes the product better for everyone else.",
    patterns: [/network effect/],
  },
  {
    term: "Go-to-market (GTM)",
    definition: "How you'll actually reach and sell to customers.",
    tip: "Name specific channels — agent networks, mobile money, distributors, churches/markets, telcos, partnerships.",
    patterns: [/go-to-market/, /go to market/, /\bgtm\b/],
  },
  {
    term: "Distribution",
    definition: "How your product physically reaches users.",
    tip: "Explain your route to the customer — agents, telcos, retail, mobile money, or partner platforms.",
    patterns: [/distribution/, /distribute/, /reach (your )?(users|customers)/],
  },
  {
    term: "Traction",
    definition: "Real evidence that people want and use your product.",
    tip: "Share concrete numbers — active users, revenue, paying customers, pilots, or a growing waitlist.",
    patterns: [/\btraction\b/],
  },
  {
    term: "Gross margin",
    definition:
      "What's left from revenue after the direct cost of delivering your product.",
    tip: "Explain how much of each naira/cedi/shilling you keep after costs — and how it improves at scale.",
    patterns: [/gross margin/, /\bmargins?\b/],
  },
  {
    term: "Revenue model",
    definition: "How your business actually makes money.",
    tip: "State clearly whether it's subscription, commission, transaction fee, markup, or B2B contract.",
    patterns: [/revenue model/, /business model/, /how do you make money/, /how.{0,15}monetiz/, /monetis/],
  },
  {
    term: "ARPU",
    definition: "Average Revenue Per User — what a typical user pays you.",
    tip: "Give a realistic per-user figure for your market, not an inflated Western benchmark.",
    patterns: [/\barpu\b/, /average revenue per user/, /revenue per user/],
  },
  {
    term: "Payback period",
    definition:
      "How long it takes to earn back what you spent acquiring a customer.",
    tip: "Say how many months until a customer repays their acquisition cost.",
    patterns: [/payback/],
  },
  {
    term: "Product-market fit",
    definition: "Clear proof that a specific group really needs your product.",
    tip: "Point to who loves it and the behaviour that proves it — usage, referrals, or paying without pushing.",
    patterns: [/product[- ]market fit/, /\bpmf\b/],
  },
  {
    term: "Scalability",
    definition: "Whether you can grow without costs rising just as fast.",
    tip: "Explain how you grow to more users or new markets without your costs climbing one-for-one.",
    patterns: [/scalab/, /\bscaling\b/, /how.{0,15}\bscale\b/],
  },
  {
    term: "Pipeline",
    definition: "The deals or customers you're in the process of closing.",
    tip: "Share what's in progress — signed LOIs, pilots, or partnerships near close.",
    patterns: [/pipeline/],
  },
  {
    term: "MVP",
    definition:
      "Minimum Viable Product — the simplest version that delivers real value.",
    tip: "Describe the smallest working version you can put in users' hands, not the full vision.",
    patterns: [/\bmvp\b/, /minimum viable/],
  },
  {
    term: "Cohort",
    definition: "A group of users grouped by when they joined, tracked over time.",
    tip: "Show whether later groups of users behave better than earlier ones — proof you're improving.",
    patterns: [/cohort/],
  },
  {
    term: "Use of funds",
    definition: "Exactly how you'll spend the money you're raising.",
    tip: "Break the raise into clear buckets — product, hiring, distribution — tied to specific milestones.",
    patterns: [/use of funds/, /use of proceeds/, /spend the (money|raise|funds)/, /what.{0,15}do with the (money|raise|funds)/],
  },
  {
    term: "The ask",
    definition: "How much you're raising and on what terms.",
    tip: "State a specific, realistic amount for your stage and what it gets you to — not a round number you can't justify.",
    patterns: [/the ask/, /how much.{0,15}(raising|raise|need)/, /raising/, /round size/],
  },
  {
    term: "Regulatory / licensing",
    definition: "The approvals you need to operate legally.",
    tip: "Show you understand the licences or compliance your sector requires (fintech, health, etc.) and your plan for them.",
    patterns: [/regulat/, /licen[sc]/, /compliance/],
  },
  {
    term: "B2B / B2C / B2G",
    definition: "Whether you sell to businesses, consumers, or government.",
    tip: "Be clear who actually pays you, and why that buyer is the right wedge for your market.",
    patterns: [/\bb2b\b/, /\bb2c\b/, /\bb2g\b/, /who (actually )?pays/, /sell to (businesses|consumers|government)/],
  },
  {
    term: "Conversion rate",
    definition: "The share of interested people who become paying customers.",
    tip: "Share how many of those who try you actually pay — and how you'd lift it.",
    patterns: [/conversion/, /\bconvert\b/],
  },
];

// LTV:CAC ratio is a special case — it only applies when BOTH terms appear, so
// it's checked before the per-term loop rather than living in the ordered list.
const LTV_CAC_RATIO: AnswerTip = {
  term: "LTV:CAC",
  definition:
    "The ratio of what a customer is worth versus what they cost to acquire.",
  tip: "Show that a customer earns you more than they cost — a healthy gap, not break-even.",
  patterns: [],
};

export const FALLBACK_TIP: AnswerTip = {
  term: "Answer with substance",
  definition: "No specific concept detected in this question.",
  tip: "Answer directly, be specific, and back your claims with real numbers wherever you can.",
  patterns: [],
};

/**
 * Keyword-match a panelist's question to a coaching card. Never throws; returns
 * the generic fallback when nothing specific matches.
 */
export function matchAnswerTip(question: string | undefined | null): AnswerTip {
  const q = (question || "").toLowerCase();
  if (!q.trim()) return FALLBACK_TIP;

  // Combined concept first: only fire the ratio card when both terms are present.
  if (/\bltv\b/.test(q) && /\bcac\b/.test(q)) return LTV_CAC_RATIO;

  for (const entry of ANSWER_TIPS) {
    if (entry.patterns.some((p) => p.test(q))) return entry;
  }
  return FALLBACK_TIP;
}
