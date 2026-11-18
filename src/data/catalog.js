// All data in this file is fictional and exists only for the prototype.
// In production this layer is replaced by YourDOST's APIs (directory, availability,
// content library, employer contracts). Nothing else in the app needs to change.

export const USER = {
  id: "u_demo_01",
  firstName: "Ananya",
  role: "Software engineer",
  employer: "Brightline Systems",
  languages: ["English", "Kannada", "Hindi"],
  phone: "98765 43210",
};

export const COVERAGE = {
  employer: "Brightline Systems",
  counsellingSessions: "unlimited",
  selfHelp: "included",
  crisisLine: "24x7, included",
  hrVisibility: "Anonymous, company-wide trends only. No individual data, ever.",
};

export const CONCERNS = {
  work_stress: "Work pressure",
  burnout: "Burnout",
  anxiety: "Worry and anxiety",
  low_mood: "Feeling low",
  sleep: "Sleep",
  relationships: "Relationships",
  family: "Family",
  career: "Career",
  grief: "Loss and grief",
  loneliness: "Loneliness",
};

// hoursFromNow is turned into a real slot time at runtime so the demo always looks current.
export const COUNSELLORS = [
  { id: "c1", name: "Meera Iyer", title: "Clinical psychologist", years: 9, gender: "woman",
    concerns: ["work_stress", "burnout", "anxiety"], languages: ["English", "Tamil", "Hindi"], hoursFromNow: 4 },
  { id: "c2", name: "Rohan Kapoor", title: "Counselling psychologist", years: 6, gender: "man",
    concerns: ["relationships", "family", "low_mood"], languages: ["English", "Hindi"], hoursFromNow: 22 },
  { id: "c3", name: "Kavya Rao", title: "Counselling psychologist", years: 5, gender: "woman",
    concerns: ["sleep", "anxiety", "work_stress"], languages: ["English", "Kannada"], hoursFromNow: 6 },
  { id: "c4", name: "Arjun Menon", title: "Career and life coach", years: 8, gender: "man",
    concerns: ["career", "work_stress"], languages: ["English", "Malayalam", "Hindi"], hoursFromNow: 3 },
  { id: "c5", name: "Sana Qureshi", title: "Clinical psychologist", years: 11, gender: "woman",
    concerns: ["grief", "low_mood", "loneliness"], languages: ["English", "Hindi", "Urdu"], hoursFromNow: 5 },
  { id: "c6", name: "Priya Reddy", title: "Counselling psychologist", years: 7, gender: "woman",
    concerns: ["family", "relationships", "burnout"], languages: ["English", "Telugu", "Hindi"], hoursFromNow: 50 },
  { id: "c7", name: "Vikram Shetty", title: "Counselling psychologist", years: 4, gender: "man",
    concerns: ["anxiety", "loneliness", "career"], languages: ["English", "Kannada", "Hindi"], hoursFromNow: 9 },
  { id: "c8", name: "Nandini Das", title: "Clinical psychologist", years: 10, gender: "woman",
    concerns: ["low_mood", "anxiety", "sleep"], languages: ["English", "Bengali", "Hindi"], hoursFromNow: 30 },
];

export const SELF_HELP = [
  { id: "s_overwhelm", title: "Untangling work overwhelm", length: "4 short sessions, 10 min each",
    concerns: ["work_stress", "burnout"], summary: "Sort what's urgent from what's loud, and get one evening back this week." },
  { id: "s_sleep", title: "Sleep reset: 7 nights", length: "7 nights, 10 min each",
    concerns: ["sleep", "anxiety"], summary: "A wind-down routine for racing thoughts at bedtime." },
  { id: "s_thoughts", title: "Noticing heavy thoughts", length: "5 sessions, 8 min each",
    concerns: ["low_mood", "anxiety"], summary: "A gentle journal practice to catch thought spirals early." },
  { id: "s_boundaries", title: "Saying no without guilt", length: "3 sessions, 10 min each",
    concerns: ["work_stress", "relationships", "family"], summary: "Practise clear, kind ways to protect your time." },
  { id: "s_connect", title: "Feeling less alone", length: "4 sessions, 10 min each",
    concerns: ["loneliness", "grief"], summary: "Small, doable steps to reconnect with people who matter." },
  { id: "s_career", title: "Finding your footing at work", length: "3 sessions, 12 min each",
    concerns: ["career"], summary: "Get clear on what you want next, one question at a time." },
];

// Every self-help programme opens with this 1-minute settle, so "Start now" always works instantly.
export const SETTLE = { id: "s_settle", title: "1-minute settle", length: "1 min" };

export const CRISIS_PROTOCOL = {
  onDuty: { name: "Ritu", title: "On-duty crisis counsellor" },
  helplines: [
    { label: "Tele MANAS (free, 24x7)", number: "14416" },
    { label: "Emergency", number: "112" },
  ],
};
