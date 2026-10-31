// Copy for the landing page sections. Edit the text, plans and prices here.

export type FeatureIcon = "phone" | "language" | "shield" | "memory" | "bell" | "search" | "message" | "log";

export const MODES = [
  {
    name: "Call & Cut",
    body: "Say what you need and hang up. Vardaan works on it in the background and calls or texts you when it's done.",
    example: "Email my landlord the kitchen tap is leaking, and tell me when he replies.",
    reply: "On it. You can hang up, I'll text you the draft to approve.",
    scene: "tulips" as const,
  },
  {
    name: "Talk & Help",
    body: "Stay on the line and work it out together, in real time, like a patient friend who knows a lot.",
    example: "My electricity bill doubled this month. Can you explain why?",
    reply: "Let's go through it together. Read me the units used this month and last month.",
    scene: "lotus" as const,
  },
];

export const FEATURES: { icon: FeatureIcon; title: string; body: string }[] = [
  {
    icon: "phone",
    title: "Real phone calls",
    body: "Vardaan rings your actual phone, and picks up when you call it. No app to open, no screen to look at.",
  },
  {
    icon: "language",
    title: "Your own language",
    body: "Speak the way you normally do. Vardaan talks on calls in English and nine Indian languages, mixing included.",
  },
  {
    icon: "shield",
    title: "Asks before it acts",
    body: "Nothing is sent without you. Vardaan drafts the email or message and waits for your YES.",
  },
  {
    icon: "bell",
    title: "Reminders that call you",
    body: "Ask once and forget it. When it's time, Vardaan phones you and offers to handle it.",
  },
  {
    icon: "memory",
    title: "Remembers you",
    body: "Your landlord's email, your usual pharmacy, how you like things done. Tell it once.",
  },
  {
    icon: "search",
    title: "Researches for you",
    body: "Comparisons, prices, how-tos. Vardaan searches the web and calls you back with what it found.",
  },
  {
    icon: "message",
    title: "Updates by text",
    body: "Questions, results and approvals arrive as SMS. Reply to answer, or YES to approve.",
  },
  {
    icon: "log",
    title: "Everything on record",
    body: "Every call with its transcript, every task and every message, in one dashboard.",
  },
];

// Prices are placeholders until launch. The beta is free.
export const PLANS = [
  {
    name: "Beta",
    art: "sprout" as const,
    price: 0,
    period: "during the beta",
    blurb: "Everything Vardaan does today, free while we're in private beta.",
    cta: { label: "Create free account", href: "/signup" },
    status: "Available now",
    highlight: true,
    features: [
      "Call Vardaan, or have it call you",
      "Call & Cut and Talk & Help",
      "Reminder calls",
      "SMS updates and YES approvals",
      "Memory and web research",
      "Full call and task history",
    ],
  },
  {
    name: "Plus",
    art: "bloom" as const,
    price: 199,
    period: "per month",
    blurb: "For everyday use, once the beta ends.",
    cta: { label: "Join waitlist", href: "/#join" },
    status: "Coming soon",
    highlight: false,
    features: [
      "Everything in Beta",
      "A local Indian number to call",
      "More calls and longer calls",
      "Emails sent for you on approval",
      "WhatsApp updates",
    ],
  },
  {
    name: "Family",
    art: "tree" as const,
    price: 499,
    period: "per month",
    blurb: "One Vardaan for the whole household.",
    cta: { label: "Join waitlist", href: "/#join" },
    status: "Coming soon",
    highlight: false,
    features: ["Everything in Plus", "Up to 5 family members", "Shared reminders", "Calls for parents who don't use apps", "Priority support"],
  },
];

export const FAQS = [
  {
    q: "What is Vardaan?",
    a: "Vardaan is a voice-first AI agent that acts on your behalf. You call it, explain what you need in your own words, and it either completes the task in the background or helps you live on the call.",
  },
  {
    q: "Which languages does it understand?",
    a: "Your own language. Speak the way you naturally do, including mixing languages mid-sentence.",
  },
  {
    q: "Do I need a smartphone or an app?",
    a: "No. Vardaan works from any phone. There is nothing to install and nothing to type.",
  },
  {
    q: "How does Vardaan tell me a task is done?",
    a: "It reports back the way that suits you: a callback, an SMS or a WhatsApp message.",
  },
  {
    q: "Will it act without asking me?",
    a: "Not on anything that matters. When information is missing or a decision carries real consequences, Vardaan calls you back for approval instead of guessing.",
  },
  {
    q: "What is the difference between Call & Cut and Talk & Help?",
    a: "With Call & Cut you hang up and Vardaan finishes the task in the background. With Talk & Help you stay on the line for real-time support, like understanding a bill or drafting a reply together.",
  },
  {
    q: "Is Vardaan free?",
    a: "Yes, during the private beta. Paid plans come later, and we'll tell you well before anything changes.",
  },
  {
    q: "When can I start using it?",
    a: "Vardaan is in private beta and new spots open every month. Join the waitlist and we'll invite you as soon as there is room.",
  },
];
