const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const EXPORTS_DIR = path.join(UPLOADS_DIR, "exports");
const FONTS_DIR = path.join(ROOT_DIR, "Fonts");
const DOC_ASSETS_DIR = path.join(UPLOADS_DIR, "doc-assets");

module.exports = {
  ROOT_DIR,
  UPLOADS_DIR,
  EXPORTS_DIR,
  FONTS_DIR,
  DOC_ASSETS_DIR,
};
