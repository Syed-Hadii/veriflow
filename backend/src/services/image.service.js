const fs = require("fs");
const path = require("path");
const { loadImage } = require("canvas");
const { ROOT_DIR } = require("../utils/constants");

const isDataUrl = (value) =>
  typeof value === "string" && value.startsWith("data:");

const resolveImagePath = (value) => {
  if (!value || typeof value !== "string") return null;
  if (isDataUrl(value)) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return path.join(ROOT_DIR, value);
  if (path.isAbsolute(value)) return value;
  return path.join(ROOT_DIR, value);
};

const loadImageSafe = async (value) => {
  const resolved = resolveImagePath(value);
  if (!resolved) {
    console.warn("loadImageSafe: could not resolve path for", value);
    return null;
  }

  try {
    return await loadImage(resolved);
  } catch (error) {
    console.error(
      "loadImageSafe: failed to load image",
      resolved,
      error.message,
    );
    return null;
  }
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const saveBufferToFile = async (buffer, filePath) => {
  ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

module.exports = {
  isDataUrl,
  resolveImagePath,
  loadImageSafe,
  ensureDir,
  saveBufferToFile,
};
