const normalizeMrzValue = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, "<");

const normalizeName = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z]/g, "<")
    .replace(/<+/g, "<")
    .replace(/^<|<$/g, "");

const padRight = (value, length, char = "<") => {
  const raw = String(value || "");
  if (raw.length >= length) return raw.slice(0, length);
  return raw + char.repeat(length - raw.length);
};

const toYYMMDD = (value) => {
  if (!value) return "<<<<<<";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "<<<<<<";
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
};

const computeCheckDigit = (input) => {
  const values = {
    "<": 0,
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 18,
    J: 19,
    K: 20,
    L: 21,
    M: 22,
    N: 23,
    O: 24,
    P: 25,
    Q: 26,
    R: 27,
    S: 28,
    T: 29,
    U: 30,
    V: 31,
    W: 32,
    X: 33,
    Y: 34,
    Z: 35,
  };

  const weights = [7, 3, 1];
  const chars = String(input || "").toUpperCase();
  let total = 0;

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    const value = values[char] ?? 0;
    total += value * weights[i % weights.length];
  }

  return String(total % 10);
};

const buildMrz = ({
  surname,
  givenName,
  nationality,
  dob,
  gender,
  expiry,
  passportNumber,
  personalNumber,
} = {}) => {
  const docType = "P";
  const issuingCountry = padRight(normalizeName(nationality || "EST"), 3, "<");
  const namePart = `${normalizeName(surname)}<<${normalizeName(givenName)}`;
  const line1 = padRight(`${docType}<${issuingCountry}${namePart}`, 44, "<");

  const passport = padRight(normalizeMrzValue(passportNumber || ""), 9, "<");
  const passportCheck = computeCheckDigit(passport);
  const birth = toYYMMDD(dob);
  const birthCheck = computeCheckDigit(birth);
  const sex = String(gender || "")
    .toUpperCase()
    .startsWith("F")
    ? "F"
    : String(gender || "")
          .toUpperCase()
          .startsWith("M")
      ? "M"
      : "<";
  const expiryDate = toYYMMDD(expiry);
  const expiryCheck = computeCheckDigit(expiryDate);
  const personal = padRight(normalizeMrzValue(personalNumber || ""), 14, "<");
  const personalCheck = computeCheckDigit(personal);

  const line2Base = `${passport}${passportCheck}${issuingCountry}${birth}${birthCheck}${sex}${expiryDate}${expiryCheck}${personal}${personalCheck}`;
  const compositeCheck = computeCheckDigit(
    `${passport}${passportCheck}${birth}${birthCheck}${expiryDate}${expiryCheck}${personal}${personalCheck}`,
  );
  const line2 = padRight(`${line2Base}${compositeCheck}`, 44, "<").slice(0, 44);

  return `${line1}\n${line2}`;
};

module.exports = {
  normalizeMrzValue,
  buildMrz,
};
