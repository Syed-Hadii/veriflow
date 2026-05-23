const STORAGE_SECRET =
  import.meta.env.VITE_STORAGE_SECRET || "veriflow_storage_secret";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const deriveKey = async (salt) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(STORAGE_SECRET),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 120000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export const encryptPayload = async (payload) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(salt);
  const data = encoder.encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  return `${toBase64(salt)}.${toBase64(iv)}.${toBase64(
    new Uint8Array(encrypted),
  )}`;
};

export const decryptPayload = async (payload) => {
  try {
    const [saltValue, ivValue, cipherValue] = payload.split(".");
    if (!saltValue || !ivValue || !cipherValue) return null;

    const salt = fromBase64(saltValue);
    const iv = fromBase64(ivValue);
    const cipher = fromBase64(cipherValue);
    const key = await deriveKey(salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipher,
    );

    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    return null;
  }
};

export const readSecureItem = async (key) => {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  return decryptPayload(stored);
};

export const writeSecureItem = async (key, value) => {
  const encrypted = await encryptPayload(value);
  localStorage.setItem(key, encrypted);
};

export const clearSecureItem = (key) => {
  localStorage.removeItem(key);
};
