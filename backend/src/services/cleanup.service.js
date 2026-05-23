const fs = require("fs");
const path = require("path");

const deleteOldFiles = async (dirPath, maxAgeMs) => {
  if (!fs.existsSync(dirPath)) return;

  const entries = await fs.promises.readdir(dirPath);

  const now = Date.now();

  await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(dirPath, entry);

      try {
        const stat = await fs.promises.stat(filePath);

        if (!stat.isFile()) return;

        const age = now - stat.mtimeMs;

        if (age > maxAgeMs) {
          await fs.promises.unlink(filePath);
          console.log("[cleanup] Deleted old file:", filePath);
        }
      } catch (error) {
        console.error("[cleanup] Failed:", filePath, error.message);
      }
    }),
  );
};

module.exports = {
  deleteOldFiles,
};
