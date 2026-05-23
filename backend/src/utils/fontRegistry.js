const fs = require("fs");
const path = require("path");
const { registerFont } = require("canvas");
const { FONTS_DIR } = require("./constants");

let fontsRegistered = false;

const FONT_CANDIDATES = [
  {
    family: "Adobe Fan Heiti Std",
    weight: "normal",
    file: "AdobeFanHeitiStd-Bold.otf",
  },
  {
    family: "AdobeFanHeiti",
    weight: "normal",
    file: "AdobeFanHeitiStd-Bold.otf",
  },
  // {
  //   family: "Codystar",
  //   weight: "300",
  //   file: "Codystar-Light.ttf",
  // },
  {
    family: "Codystar",
    weight: "400",
    file: "Codystar-Regular.ttf",
  },
  {
    family: "OCR-B10PitchBT",
    weight: "bold",
    file: "OCR-B10PitchBT.otf",
  },
  {
    family: "Perfo_Estonia",
    weight: "bold",
    file: "Perfo_Estonia.otf",
  },
  {
    family: "Tahoma",
    weight: "normal",
    file: "Tahoma-Regular.ttf",
  },
  {
    family: "Tahoma",
    weight: "bold",
    file: "Tahoma-Bold.ttf",
  },
];

const ensureFontsRegistered = () => {
  if (fontsRegistered) return;

  FONT_CANDIDATES.forEach((font) => {
    const filePath = path.join(FONTS_DIR, font.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`[fontRegistry] Missing font file: ${filePath}`);
      return;
    }

    try {
      registerFont(filePath, {
        family: font.family,
        weight: font.weight,
      });

      console.log(
        `[fontRegistry] Registered: ${font.family} ${font.weight} -> ${font.file}`,
      );
    } catch (error) {
      console.error(
        `[fontRegistry] Failed to register ${font.file}:`,
        error.message,
      );
    }
  });

  fontsRegistered = true;
};

module.exports = {
  ensureFontsRegistered,
};
