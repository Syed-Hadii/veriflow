const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const { ensureFontsRegistered } = require("../utils/fontRegistry");
const { loadImageSafe, resolveImagePath } = require("./image.service");
const { generateBarcodeBuffer } = require("./barcode.service");

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => {
  return Math.max(min, Math.min(value, max));
};

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const summarizeValue = (value) => {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  const text = String(value);
  const preview = text.slice(0, 40).replace(/\s+/g, " ");
  return `${preview}... (len=${text.length})`;
};

const resolveImageValueForElement = (element, data) => {
  if (!element || !data) return undefined;

  const key = normalizeKey(element.key);

  if (key.includes("primary") || key.includes("front")) {
    return (
      data[element.key] ||
      data.primary_image ||
      data.front_image ||
      data.image ||
      data.photo
    );
  }

  if (key.includes("secondary") || key.includes("back")) {
    return data[element.key] || data.secondary_image || data.back_image;
  }

  return data[element.key];
};

const normalizeFontWeight = (weight) => {
  if (!weight) return "normal";

  const value = String(weight).trim().toLowerCase();

  const weightMap = {
    thin: "100",
    extralight: "200",
    "extra-light": "200",
    light: "300",
    regular: "400",
    normal: "400",
    medium: "500",
    semibold: "600",
    "semi-bold": "600",
    bold: "700",
    extrabold: "800",
    "extra-bold": "800",
    black: "900",
  };

  if (weightMap[value]) {
    return Number(weightMap[value]) >= 600 ? "bold" : "normal";
  }

  const numericWeight = Number(value);
  if (Number.isFinite(numericWeight)) {
    return numericWeight >= 600 ? "bold" : "normal";
  }

  return value === "bold" ? "bold" : "normal";
};

const normalizeFontFamily = (family) => {
  const value = String(family || "").trim();

  if (!value) {
    return "Adobe Fan Heiti Std";
  }

  if (value === "AdobeFanHeiti" || value === "Adobe Fan Heiti Std B") {
    return "Adobe Fan Heiti Std";
  }

  return value;
};

const getLetterSpacing = (style = {}) => {
  return toNumber(style.letterSpacing, 0);
};

const measureTextWidth = (ctx, text, style = {}) => {
  const value = String(text ?? "");
  if (!value) return 0;

  const spacing = getLetterSpacing(style);
  const chars = [...value];

  let width = 0;
  chars.forEach((char, index) => {
    width += ctx.measureText(char).width;
    if (index < chars.length - 1) {
      width += spacing;
    }
  });

  return width;
};

const buildFontString = (style = {}) => {
  const fontSize = toNumber(style.fontSize, 16);
  const fontWeight = normalizeFontWeight(style.fontWeight);
  const fontFamily = normalizeFontFamily(style.fontFamily);

  return `${fontWeight} ${fontSize}px "${fontFamily}"`;
};

const formatDateForRender = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  // Already dd.mm.yyyy
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
    return raw;
  }

  // yyyy-mm-dd or yyyy/mm/dd
  const isoMatch = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}.${month}.${year}`;
  }

  // yyyymmdd
  const compactMatch = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const [, year, month, day] = compactMatch;
    return `${day}.${month}.${year}`;
  }

  // JS Date fallback
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  return raw;
};

const resolveTextStyle = (element = {}) => {
  return {
    fontSize: 16,
    fontFamily: "Adobe Fan Heiti Std",
    fontWeight: "400",
    color: "#000000",
    textAlign: "left",
    textBaseline: "bottom",
    opacity: 1,
    lineHeight: undefined,
    fakeBold: false,
    strokeWidth: 0.3,
    vertical: false,
    anchorLastLine: false,
    ...(element.style || {}),
  };
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, style = {}) => {
  const words = String(text || "").split(" ");
  let line = "";
  let drawY = y;

  words.forEach((word, index) => {
    const testLine = line ? `${line} ${word}` : word;
    const width = measureTextWidth(ctx, testLine, style);

    if (width > maxWidth && line) {
      drawStyledText(ctx, line, x, drawY, style);
      line = word;
      drawY += lineHeight;
    } else {
      line = testLine;
    }

    if (index === words.length - 1) {
      drawStyledText(ctx, line, x, drawY, style);
    }
  });
};

const drawSingleText = (ctx, text, x, y, style = {}) => {
  const value = String(text ?? "");

  if (style.fakeBold) {
    ctx.save();
    ctx.lineWidth = toNumber(style.strokeWidth, 0.3);
    ctx.strokeStyle = style.color || "#000000";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(value, x, y);
    ctx.restore();
  }

  ctx.fillText(value, x, y);
};

const drawStyledText = (ctx, text, x, y, style = {}) => {
  const value = String(text ?? "");
  const spacing = getLetterSpacing(style);

  if (!value) return;

  if (!spacing) {
    drawSingleText(ctx, value, x, y, style);
    return;
  }

  let cursorX = x;
  const chars = [...value];

  chars.forEach((char, index) => {
    drawSingleText(ctx, char, cursorX, y, style);
    cursorX += ctx.measureText(char).width;

    if (index < chars.length - 1) {
      cursorX += spacing;
    }
  });
};

const drawMrzText = (ctx, text, x, y, width, height, style = {}) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .filter(Boolean);

  if (!lines.length) return;

  ctx.save();

  ctx.font = buildFontString(style);
  ctx.fillStyle = style.color || "#000000";
  ctx.textAlign = style.textAlign || "left";
  ctx.textBaseline = "top";
  ctx.globalAlpha = clamp(toNumber(style.opacity, 1), 0, 1);

  const fontSize = toNumber(style.fontSize, 60);

  if (lines.length === 1) {
    drawStyledText(ctx, lines[0], x, y, style);
    ctx.restore();
    return;
  }

  const firstLineOffsetY = toNumber(style.firstLineOffsetY, 0);
  const secondLineOffsetY = toNumber(style.secondLineOffsetY, -4);

  const firstLineY = y + firstLineOffsetY;
  const secondLineY = y + height - fontSize + secondLineOffsetY;

  drawStyledText(ctx, lines[0], x, firstLineY, {
    ...style,
    textBaseline: "top",
  });

  drawStyledText(ctx, lines[1], x, secondLineY, {
    ...style,
    textBaseline: "top",
  });

  ctx.restore();
};

const drawMultilineText = (ctx, text, x, y, lineHeight, style = {}) => {
  const lines = String(text || "").split(/\r?\n/);

  let startY = y;

  // agar last line ko same position pe rakhna ho
  if (style.anchorLastLine && lines.length > 1) {
    startY = y - (lines.length - 1) * lineHeight;
  }

  let drawY = startY;

  lines.forEach((line) => {
    drawStyledText(ctx, line, x, drawY, style);
    drawY += lineHeight;
  });
};

const fitFontSizeToBox = ({
  ctx,
  text,
  style,
  maxWidth,
  maxHeight,
  minFontSize = 24,
}) => {
  const lines = String(text || "").split(/\r?\n/);

  let fontSize = toNumber(style.fontSize, 42);

  const originalFontSize = toNumber(style.fontSize, 42);
  const originalLineHeight = toNumber(style.lineHeight, originalFontSize * 1.2);
  const lineHeightRatio = originalLineHeight / originalFontSize;

  let lineHeight = Math.round(fontSize * lineHeightRatio);

  while (fontSize > minFontSize) {
    ctx.font = buildFontString({
      ...style,
      fontSize,
    });

    const widestLine = Math.max(
      ...lines.map((line) => measureTextWidth(ctx, line, style)),
      0,
    );

    const totalTextHeight = lines.length * lineHeight;

    if (widestLine <= maxWidth && totalTextHeight <= maxHeight) {
      break;
    }

    fontSize -= 1;
    lineHeight = Math.round(fontSize * lineHeightRatio);
  }

  return {
    fontSize,
    lineHeight,
  };
};

const drawTextElement = (ctx, element, value) => {
  const { position } = element;

  const x = toNumber(position?.x, 0);
  const y = toNumber(position?.y, 0);
  const width = toNumber(position?.width, 0);
  const height = toNumber(position?.height, 0);

  let resolvedStyle = resolveTextStyle(element);
  let fontSize = toNumber(resolvedStyle.fontSize, 16);
  let lineHeight = toNumber(resolvedStyle.lineHeight, fontSize * 1.2);

  const shouldFormatDate =
    element.type === "date" ||
    ["dob", "doe", "doi", "issue_date", "expiry_date"].includes(element.key);

  const textValue = shouldFormatDate
    ? formatDateForRender(value)
    : String(value ?? "");

  if (!textValue) return;

  ctx.save();

  if (element.key === "mrz" && width > 0 && height > 0) {
    ctx.font = buildFontString(resolvedStyle);
    ctx.fillStyle = resolvedStyle.color || "#000000";
    ctx.textAlign = resolvedStyle.textAlign || "left";
    ctx.textBaseline = "top";
    ctx.globalAlpha = clamp(toNumber(resolvedStyle.opacity, 1), 0, 1);

    drawMrzText(ctx, textValue, x, y, width, height, resolvedStyle);

    ctx.restore();
    return;
  }

  ctx.font = buildFontString(resolvedStyle);
  ctx.fillStyle = resolvedStyle.color || "#000000";
  ctx.textAlign = resolvedStyle.textAlign || "left";
  ctx.textBaseline = resolvedStyle.textBaseline || "bottom";
  ctx.globalAlpha = clamp(toNumber(resolvedStyle.opacity, 1), 0, 1);
  console.log("[text-debug]", {
    key: element.key,
    type: element.type,
    font: ctx.font,
    fontFamily: resolvedStyle.fontFamily,
    fontWeight: resolvedStyle.fontWeight,
    fakeBold: resolvedStyle.fakeBold,
    strokeWidth: resolvedStyle.strokeWidth,
    fontSize: resolvedStyle.fontSize,
    lineHeight: resolvedStyle.lineHeight,
  });

  // Temporary debug, issue solve hone ke baad remove kar dena
  // console.log("[font-debug]", element.key, ctx.font);

  if (resolvedStyle.vertical) {
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    drawStyledText(ctx, textValue, 0, 0, resolvedStyle);
    ctx.restore();
    return;
  }

  if (width > 0 && element.type === "textarea") {
    if (textValue.includes("\n")) {
      drawMultilineText(ctx, textValue, x, y, lineHeight, resolvedStyle);
    } else {
      wrapText(ctx, textValue, x, y, width, lineHeight, resolvedStyle);
    }
  } else if (textValue.includes("\n")) {
    drawMultilineText(ctx, textValue, x, y, lineHeight, resolvedStyle);
  } else {
    drawStyledText(ctx, textValue, x, y, resolvedStyle);
  }

  ctx.restore();
};

const drawImageElement = async (ctx, element, imageValue) => {
  if (!imageValue) return;

  const image = await loadImageSafe(imageValue);
  if (!image) return;

  const { position } = element;
  const x = toNumber(position?.x, 0);
  const y = toNumber(position?.y, 0);
  const w = toNumber(position?.width, image.width);
  const h = toNumber(position?.height, image.height);

  const featherSize = toNumber(element.featherSize, 10);
  // CRITICAL FIX: Linear Multiply integration helps merging white backgrounds natively
  const blendMode = element.blendMode || "multiply";
  const opacity = clamp(toNumber(element.opacity, 1), 0, 1);

  if (!featherSize) {
    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = opacity;
    ctx.drawImage(image, x, y, w, h);
    ctx.restore();
    return;
  }

  // Soft corner masking process
  const maskCanvas = createCanvas(w, h);
  const maskCtx = maskCanvas.getContext("2d");
  maskCtx.fillStyle = "rgba(0,0,0,1)";
  maskCtx.fillRect(0, 0, w, h);
  maskCtx.globalCompositeOperation = "destination-out";

  // Left Edge Smooth Feathering
  const leftGrad = maskCtx.createLinearGradient(0, 0, featherSize, 0);
  leftGrad.addColorStop(0, "rgba(0,0,0,1)");
  leftGrad.addColorStop(1, "rgba(0,0,0,0)");
  maskCtx.fillStyle = leftGrad;
  maskCtx.fillRect(0, 0, featherSize, h);

  // Right Edge Smooth Feathering
  const rightGrad = maskCtx.createLinearGradient(w - featherSize, 0, w, 0);
  rightGrad.addColorStop(0, "rgba(0,0,0,0)");
  rightGrad.addColorStop(1, "rgba(0,0,0,1)");
  maskCtx.fillStyle = rightGrad;
  maskCtx.fillRect(w - featherSize, 0, featherSize, h);

  // Top Edge Smooth Feathering
  const topGrad = maskCtx.createLinearGradient(0, 0, 0, featherSize);
  topGrad.addColorStop(0, "rgba(0,0,0,1)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  maskCtx.fillStyle = topGrad;
  maskCtx.fillRect(0, 0, w, featherSize);

  // Bottom Edge Smooth Feathering
  const bottomGrad = maskCtx.createLinearGradient(0, h - featherSize, 0, h);
  bottomGrad.addColorStop(0, "rgba(0,0,0,0)");
  bottomGrad.addColorStop(1, "rgba(0,0,0,1)");
  maskCtx.fillStyle = bottomGrad;
  maskCtx.fillRect(0, h - featherSize, w, featherSize);

  const featherCanvas = createCanvas(w, h);
  const fCtx = featherCanvas.getContext("2d");
  fCtx.drawImage(image, 0, 0, w, h);
  fCtx.globalCompositeOperation = "destination-in";
  fCtx.drawImage(maskCanvas, 0, 0);

  // Core Drawing Pipeline update
  ctx.save();
  ctx.globalCompositeOperation = blendMode;
  ctx.globalAlpha = opacity;
  ctx.drawImage(featherCanvas, x, y);
  ctx.restore();
};

const normalizeQrValue = (value) => {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const drawQrElement = async (ctx, element, value) => {
  const qrValue = normalizeQrValue(value);
  if (!qrValue) return;

  const { position } = element;

  const x = toNumber(position?.x, 0);
  const y = toNumber(position?.y, 0);
  const width = toNumber(position?.width, 160);
  const height = toNumber(position?.height, width);

  const qrSize = Math.max(Math.ceil(width), Math.ceil(height), 160);

  const qrBuffer = await QRCode.toBuffer(qrValue, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: toNumber(element.margin, 0),
    width: qrSize,
    color: {
      dark: "#000000",
      light: "#0000",
    },
  });

  const qrImage = await loadImage(qrBuffer);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImage, x, y, width, height);
  ctx.restore();
};

const drawBarcodeElement = async (ctx, element, value) => {
  if (!value) return;

  const barcodeBuffer = await generateBarcodeBuffer(String(value));
  if (!barcodeBuffer) return;

  const barcodeImage = await loadImage(barcodeBuffer);
  const { position } = element;

  const x = toNumber(position?.x, 0);
  const y = toNumber(position?.y, 0);
  const width = toNumber(position?.width, barcodeImage.width);
  const height = toNumber(position?.height, barcodeImage.height);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(barcodeImage, x, y, width, height);
  ctx.restore();
};

const renderPage = async (
  page,
  data,
  patternPath = "",
  patternOpacity = 0.5,
) => {
  if (!page) return null;

  console.log("[renderPage] Start", {
    width: page?.width,
    height: page?.height,
    elements: Array.isArray(page?.elements) ? page.elements.length : 0,
    patternPath,
    patternOpacity,
  });

  ensureFontsRegistered();

  const width = toNumber(page.width, 1000);
  const height = toNumber(page.height, 600);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Step 1: Draw background
  if (page.backgroundImage) {
    const background = await loadImageSafe(page.backgroundImage);

    if (background) {
      ctx.drawImage(background, 0, 0, width, height);
    } else {
      console.warn("[renderPage] Background not found:", {
        backgroundImage: page.backgroundImage,
        resolved: resolveImagePath(page.backgroundImage),
      });
    }
  }

  // Step 2: Draw elements
  const elements = Array.isArray(page.elements) ? page.elements : [];

  for (const element of elements) {
    if (!element || element.render === false) continue;

    const value =
      element.type === "image"
        ? resolveImageValueForElement(element, data)
        : data?.[element.key];

    if (element.type === "image") {
      console.log("[renderPage] Resolved image value", {
        key: element.key,
        resolved: summarizeValue(value),
        defaultValue: summarizeValue(element.defaultValue),
        blendMode: element.blendMode,
        featherSize: element.featherSize,
      });
    }

    if (
      [
        "text",
        "textarea",
        "number",
        "date",
        "email",
        "phone",
        "address",
        "custom",
      ].includes(element.type)
    ) {
      drawTextElement(ctx, element, value ?? element.defaultValue ?? "");
      continue;
    }

    if (["image", "signature"].includes(element.type)) {
      await drawImageElement(ctx, element, value || element.defaultValue);
      continue;
    }

    if (element.type === "qr") {
      await drawQrElement(ctx, element, value || element.defaultValue);
      continue;
    }

    if (element.type === "barcode") {
      await drawBarcodeElement(ctx, element, value || element.defaultValue);
      continue;
    }
  }

  // Step 3: Overlay pattern
  if (patternPath) {
    const pattern = await loadImageSafe(patternPath);

    if (pattern) {
      ctx.save();
      ctx.globalAlpha = clamp(Number(patternOpacity) || 0.5, 0, 1);
      ctx.drawImage(pattern, 0, 0, width, height);
      ctx.restore();
    } else {
      const resolved = resolveImagePath(patternPath);
      console.warn("[renderPage] Pattern not found:", {
        patternPath,
        resolved,
      });
    }
  }

  return canvas;
};

module.exports = {
  renderPage,
};
