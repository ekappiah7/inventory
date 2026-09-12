// Ambiguous characters (0/O, 1/I/L) are left out so a code can be read out
// over the phone or copied off a screen without confusion.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function generateInviteCode(randomInt = (max) => Math.floor(Math.random() * max)) {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

// Accepts what someone actually types: spaces, dashes, lower case.
export function normalizeInviteCode(input) {
  return String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isWellFormedInviteCode(input) {
  const code = normalizeInviteCode(input);
  return code.length === LENGTH && [...code].every((c) => ALPHABET.includes(c));
}
