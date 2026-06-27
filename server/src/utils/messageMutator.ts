/**
 * ─── Contextual Token Mutation Engine ────────────────────────────────────────
 *
 * Dynamically transforms outgoing WhatsApp messages so that consecutive bulk
 * alerts never look structurally identical to WhatsApp's spam filters.
 *
 * Mutations applied (chosen deterministically from message hash so the same
 * message content + center always produces a different variant on re-runs):
 *  1. Synonym word-swaps for high-frequency greeting/sign-off tokens
 *  2. Variable Unicode whitespace injection (zero-width joiner, thin space)
 *  3. Dynamic date/time context appended in rotating formats
 *  4. Randomised paragraph spacing (single vs double blank lines)
 */

const GREETINGS: Record<string, string[]> = {
  "Dear ": ["Hello ", "Hi ", "Greetings ", "Dear "],
  "Thank you": ["Thank you", "Thanks", "Many thanks", "We appreciate it"],
  "Best Regards": ["Best Regards", "Warm regards", "Kind regards", "Regards"],
  "We would like to inform you": [
    "We would like to inform you",
    "We wish to let you know",
    "Please be informed",
    "This is to notify you",
  ],
  "Please let us know": [
    "Please let us know",
    "Do let us know",
    "Kindly inform us",
    "Feel free to reach out",
  ],
  "is marked ABSENT": [
    "is marked ABSENT",
    "has been marked absent",
    "was recorded as absent",
    "did not attend today",
  ],
  "HALF DAY": ["HALF DAY", "half-day", "a half day", "partial attendance"],
  "has been credited": [
    "has been credited",
    "has been transferred",
    "has been processed",
    "has been paid",
  ],
};

// Unicode invisible / spacing variants to break exact-match fingerprinting
const THIN_SPACE = "\u2009";
const ZERO_WIDTH_JOINER = "\u200D";
const ZERO_WIDTH_SPACE = "\u200B";
const HAIR_SPACE = "\u200A";

const SPACERS = [THIN_SPACE, ZERO_WIDTH_JOINER, ZERO_WIDTH_SPACE, HAIR_SPACE];

/** Simple djb2 hash → deterministic variant selector per (message, centerId) pair */
function hashSeed(text: string, centerId: string): number {
  const seed = text.slice(0, 64) + centerId;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i);
    h = h >>> 0; // unsigned 32-bit
  }
  return h;
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function injectInvisibleToken(word: string, seed: number, position: number): string {
  const spacer = pick(SPACERS, seed, position);
  const mid = Math.floor(word.length / 2);
  return word.slice(0, mid) + spacer + word.slice(mid);
}

/** Swap known phrases with synonym variants */
function swapSynonyms(text: string, seed: number): string {
  let result = text;
  let offset = 0;
  for (const [phrase, variants] of Object.entries(GREETINGS)) {
    if (result.includes(phrase)) {
      const replacement = pick(variants, seed, offset);
      result = result.replaceAll(phrase, replacement);
      offset++;
    }
  }
  return result;
}

/** Inject a single invisible Unicode spacer into a random "safe" word */
function injectSpacer(text: string, seed: number): string {
  const words = text.split(" ");
  // Only target words longer than 5 chars, not URLs or numbers
  const candidates = words
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => w.length > 5 && !/https?|[\d₹@]/.test(w));

  if (candidates.length === 0) return text;

  const target = pick(candidates, seed, 7);
  words[target.i] = injectInvisibleToken(target.w, seed, target.i);
  return words.join(" ");
}

/** Vary paragraph line-break density */
function varySpacing(text: string, seed: number): string {
  // Rotate between single and double blank-line separators
  if (seed % 3 === 0) {
    return text.replace(/\n\n/g, "\n\n\n");
  }
  return text;
}

/** Append a rotating timestamp marker (rotates format every invocation) */
function appendTimestamp(text: string, seed: number): string {
  const now = new Date();
  const formats = [
    () =>
      now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    () => `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    () => `${now.getDate()}/${now.getMonth() + 1} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    () => now.toISOString().slice(11, 16) + " UTC",
  ];
  const ts = pick(formats, seed, 3)();

  // Only append if a (Ref:) tag is not already present
  if (text.includes("(Ref:")) return text;
  return `${text}\n\n(Ref: ${ts})`;
}

/**
 * Main export — mutate a message for a specific center.
 * Deterministic for the same (message, centerId) but varies on re-calls
 * because `Date.now()` shifts the seed slightly.
 */
export function mutateMessage(message: string, centerId: string): string {
  const seed = hashSeed(message, centerId + Date.now().toString().slice(-4));

  let out = swapSynonyms(message, seed);
  out = injectSpacer(out, seed);
  out = varySpacing(out, seed);
  out = appendTimestamp(out, seed);

  return out;
}
