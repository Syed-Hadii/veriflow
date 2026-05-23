const path = require("path");
const PDFDocument = require("pdfkit");
const { createCanvas } = require("canvas");
const { renderPage } = require("./templateRender.service");
const { ensureDir, saveBufferToFile } = require("./image.service");
const { EXPORTS_DIR } = require("../utils/constants");

const combineCanvasesVertical = (frontCanvas, backCanvas) => {
  if (!frontCanvas) return backCanvas;
  if (!backCanvas) return frontCanvas;

  const width = Math.max(frontCanvas.width, backCanvas.width);
  const height = frontCanvas.height + backCanvas.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(frontCanvas, 0, 0);
  ctx.drawImage(backCanvas, 0, frontCanvas.height);
  return canvas;
};

const writePdf = async ({ filePath, pages }) => {
  ensureDir(path.dirname(filePath));

  const validPages = Array.isArray(pages) ? pages.filter(Boolean) : [];

  if (!validPages.length) {
    throw new Error("No rendered pages available for PDF export");
  }

  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = doc.pipe(require("fs").createWriteStream(filePath));

  validPages.forEach((page) => {
    doc.addPage({
      size: [page.width, page.height],
      margin: 0,
    });

    const buffer = page.toBuffer("image/png");

    doc.image(buffer, 0, 0, {
      width: page.width,
      height: page.height,
    });
  });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return filePath;
};

const exportDocument = async ({ document, format }) => {
  const template = document.template;

  const data =
    document.data && typeof document.data.entries === "function"
      ? Object.fromEntries(document.data.entries())
      : document.data || {};

  console.log("[exportDocument] Render payload", {
    documentId: String(document._id),
    layoutMode: template.layoutMode || document.layoutMode || "single",
    dataKeys: Object.keys(data),
    primary_image: data.primary_image ? "present" : "missing",
    secondary_image: data.secondary_image ? "present" : "missing",
    front_image: data.front_image ? "present" : "missing",
    back_image: data.back_image ? "present" : "missing",
  });

  const layoutMode = template.layoutMode || document.layoutMode || "single";
  const patternPath = template.pattern;
  const patternOpacity = Number.isFinite(Number(template.patternOpacity))
    ? Number(template.patternOpacity)
    : 0.5;

  const renderSingle = async () =>
    renderPage(template.single, data, patternPath, patternOpacity);

  const renderFront = async () =>
    renderPage(template.front, data, patternPath, patternOpacity);

  const renderBack = async () =>
    renderPage(template.back, data, patternPath, patternOpacity);

  const baseName = `${document._id}-${Date.now()}`;
  ensureDir(EXPORTS_DIR);

  if (format === "pdf") {
    const pages = [];

    if (layoutMode === "dual") {
      pages.push(await renderFront());
      pages.push(await renderBack());
    } else {
      pages.push(await renderSingle());
    }

    const filePath = path.join(EXPORTS_DIR, `${baseName}.pdf`);
    await writePdf({ filePath, pages });

    document.generatedFiles = {
      ...(document.generatedFiles || {}),
      pdf: filePath,
    };

    await document.save();
    return { filePath };
  }

  const imageFormat = format === "jpeg" ? "jpg" : format;
  const mimeType = imageFormat === "jpg" ? "image/jpeg" : "image/png";

  let canvas;

  if (layoutMode === "dual") {
    const front = await renderFront();
    const back = await renderBack();

    canvas = combineCanvasesVertical(front, back);
    document.generatedFiles = {
      ...(document.generatedFiles || {}),
    };
    // const frontPath = front
    //   ? path.join(EXPORTS_DIR, `${baseName}-front.png`)
    //   : "";

    // const backPath = back ? path.join(EXPORTS_DIR, `${baseName}-back.png`) : "";

    // if (front && frontPath) {
    //   await saveBufferToFile(front.toBuffer("image/png"), frontPath);
    // }

    // if (back && backPath) {
    //   await saveBufferToFile(back.toBuffer("image/png"), backPath);
    // }

    // document.generatedFiles = {
    //   ...(document.generatedFiles || {}),
    //   front: frontPath || document.generatedFiles?.front || "",
    //   back: backPath || document.generatedFiles?.back || "",
    // };
  } else {
    canvas = await renderSingle();
  }

  const filePath = path.join(EXPORTS_DIR, `${baseName}.${imageFormat}`);
  if (!canvas) {
    throw new Error("Failed to render document canvas");
  }
  const buffer =
    imageFormat === "jpg"
      ? canvas.toBuffer("image/jpeg", { quality: 0.95 })
      : canvas.toBuffer("image/png");

  await saveBufferToFile(buffer, filePath);

  document.generatedFiles = {
    ...(document.generatedFiles || {}),
    pdf: filePath,
  };

  await document.save();

  return { filePath };
};

module.exports = {
  exportDocument,
};
