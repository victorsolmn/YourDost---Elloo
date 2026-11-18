// Layer 1 of 2 for crisis detection. Runs on the RAW transcript, before clean-up,
// because clean-up could soften or drop the exact words that matter.
// Layer 2 is the AI's own risk judgement. Either layer alone is enough to route to a human.
// This list is deliberately broad: a false alarm costs a minute, a miss can cost a life.

const CRISIS_PATTERNS = [
  // English
  /suicid/i,
  /\bkill(ing)? my ?self\b/i,
  /\bend (my life|it all|everything|things)\b/i,
  /\b(want|wanna|wish) (to )?(die|be dead|disappear forever)\b/i,
  /\bdon'?t want to (live|be alive|exist|wake up)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\bbetter off if i (was|were|wasn'?t|weren'?t|just)\b/i,
  /\b(wasn'?t|weren'?t|not) (around|here) any ?more\b/i,
  /\bno one would (miss|notice) (me|if i)\b/i,
  /\bno (reason|point) (to|in) (live|living|going on)\b/i,
  /\bself[- ]?harm/i,
  /\b(hurt|harm|cut)(ting)? my ?self\b/i,
  /\boverdose\b/i,
  /\b(jump|jumping) off\b/i,
  /\bcan'?t (go on|do this anymore|take it anymore)\b/i,
  // Hinglish (romanised)
  /\bmarna (chahta|chahti|hai)\b/i,
  /\bmar (jaun|jaau|jaana|jaana chahta|jaana chahti)\b/i,
  /\bjeena nahi/i,
  /\bzindagi (khatam|se tang)/i,
  /\bkhud ?ko (khatam|nuksaan|hurt|maar)/i,
  /\baatmahatya\b/i,
  /\bjaan de (dun|du|doon|dena)/i,
  // Devanagari
  /आत्महत्या|मरना चाहता|मरना चाहती|जीना नहीं|खुद को खत्म/,
];

export function screenText(raw) {
  const text = String(raw || "");
  const matched = CRISIS_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  return { crisis: matched.length > 0, matched };
}
