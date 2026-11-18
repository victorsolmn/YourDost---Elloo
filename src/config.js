// Product knobs live here so policy changes don't need code changes elsewhere.
// In production these would come from a remote config service per employer.

export const CONFIG = {
  maxUserTurnsBeforeOptions: 3,   // Dost offers next steps by the 3rd message at the latest
  availabilityWindowHours: 24,     // prefer counsellors free within this window
  expertFirstImpact: 7,            // impact >= this always puts the expert option first
  longDurationImpact: 5,           // impact >= this AND a month or longer -> expert first
  selfHelpMaxImpact: 4,            // impact <= this leans to self-help first
  aiTimeoutMs: 25000,              // after this, fall back to the rule-based path for the turn
  apiEndpoint: "/api/dost",        // server proxy used when hosted (holds the API key)
};
