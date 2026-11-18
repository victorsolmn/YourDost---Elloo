// Strips direct identifiers before any text is sent to an AI model.
// Production would add name/employee-ID redaction and a data-retention policy;
// the point here is that redaction is a separate, testable step.

const RULES = [
  { label: "email", re: /[\w.+-]+@[\w-]+\.[\w.]+/g },
  { label: "phone number", re: /(\+?91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g },
  { label: "ID number", re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
];

export function redact(text) {
  let out = String(text || "");
  const removed = [];
  for (const r of RULES) {
    out = out.replace(r.re, () => {
      removed.push(r.label);
      return `[${r.label} removed]`;
    });
  }
  return { text: out, removed };
}
