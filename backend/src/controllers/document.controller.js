const path = require("path");
const fs = require("fs");
const Doc = require("../models/Document");
const Sequence = require("../models/Sequence");
const Template = require("../models/Template");
const { exportDocument } = require("../services/export.service");
const { buildMrz } = require("../services/mrz.service");
const { EXPORTS_DIR, DOC_ASSETS_DIR } = require("../utils/constants");
const { generateBackImage } = require("../services/imageProcessing.service");
const { ensureDir } = require("../services/image.service");

const parseMaybeJSON = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
};

const buildDataMap = (data, fieldValues) => {
  const parsedData = parseMaybeJSON(data, {});
  const parsedFieldValues = parseMaybeJSON(fieldValues, []);

  const map = new Map();
  if (parsedData && typeof parsedData === "object") {
    Object.entries(parsedData).forEach(([key, value]) => {
      map.set(key, value);
    });
  }

  if (Array.isArray(parsedFieldValues)) {
    parsedFieldValues.forEach((entry) => {
      if (!entry || !entry.key) return;
      if (!map.has(entry.key)) {
        map.set(entry.key, entry.value);
      }
    });
  }

  return {
    dataMap: Object.fromEntries(map),
    fieldValuesArray: Array.isArray(parsedFieldValues) ? parsedFieldValues : [],
  };
};

// const generatePassportNumber = async () => {
//   const prefix = "P";
//   const timestamp = Date.now().toString().slice(-6);
//   const random = Math.floor(Math.random() * 1000)
//     .toString()
//     .padStart(3, "0");
//   return `${prefix}${timestamp}${random}`;
// };

const generatePerfoText = async () => {
  const sequenceKey = "perfo_text_ke";
  const prefix = "KE";
  const width = 7;
  const startingValue = 425497;

  await Sequence.findOneAndUpdate(
    { key: sequenceKey },
    {
      $setOnInsert: {
        key: sequenceKey,
        prefix,
        width,
        value: startingValue,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  const sequence = await Sequence.findOneAndUpdate(
    { key: sequenceKey },
    { $inc: { value: 1 } },
    {
      returnDocument: "after",
    },
  );

  const perfoValue = String(sequence?.value ?? startingValue + 1).padStart(
    width,
    "0",
  );

  return `${sequence?.prefix || prefix}${perfoValue}`;
};

const generateSerialNumber = async () => {
  const sequenceKey = "serial_number_lb";
  const prefix = "LB";
  const width = 7;
  const startingValue = 943610;

  await Sequence.findOneAndUpdate(
    { key: sequenceKey },
    {
      $setOnInsert: {
        key: sequenceKey,
        prefix,
        width,
        value: startingValue,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  const sequence = await Sequence.findOneAndUpdate(
    { key: sequenceKey },
    { $inc: { value: 1 } },
    {
      returnDocument: "after",
    },
  );

  const serialValue = String(sequence?.value ?? startingValue + 1).padStart(
    width,
    "0",
  );

  return `${sequence?.prefix || prefix}${serialValue}`;
};

// @desc    Create a new document
// @route   POST /api/docs
// @access  Private

const isDataUrl = (value) =>
  typeof value === "string" && value.startsWith("data:");

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isPresentValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const summarizeValue = (value) => {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  const text = String(value);
  const preview = text.slice(0, 40).replace(/\s+/g, " ");
  return `${preview}... (len=${text.length})`;
};

const collectImageElements = (template) => {
  if (!template) return [];

  const pages = [template.single, template.front, template.back].filter(
    Boolean,
  );
  const images = [];

  pages.forEach((page) => {
    const elements = Array.isArray(page?.elements) ? page.elements : [];
    elements.forEach((element) => {
      if (!element || element.type !== "image") return;
      images.push(element);
    });
  });

  return images;
};

const resolveTemplateImageKeys = (template) => {
  const images = collectImageElements(template);
  if (!images.length) {
    return { primaryKey: null, secondaryKey: null };
  }

  const primaryByName = images.find((element) => {
    const key = normalizeKey(element.key);
    return key.includes("primary") || key.includes("front");
  });

  const primaryBySide = images.find((element) => element.side === "front");
  const primary = primaryByName || primaryBySide || images[0];

  const secondaryByName = images.find((element) => {
    const key = normalizeKey(element.key);
    return key.includes("secondary") || key.includes("back");
  });

  const secondaryBySide = images.find((element) => element.side === "back");
  const secondary =
    secondaryByName ||
    secondaryBySide ||
    images.find((element) => element.key !== primary?.key) ||
    null;

  return {
    primaryKey: primary?.key || null,
    secondaryKey: secondary?.key || null,
  };
};

const resolveImageValue = (dataMap, preferredKey, aliases = []) => {
  const candidates = [preferredKey, ...aliases].filter(Boolean);

  for (const key of candidates) {
    if (key && isPresentValue(dataMap[key])) return dataMap[key];
  }

  return null;
};

const normalizeImageExtension = (mimeType = "image/png") => {
  const ext = mimeType.split("/")[1] || "png";
  if (ext === "jpeg") return "jpg";
  return ext;
};

const saveDataUrlToFile = async (dataUrl, outputDir) => {
  const match = String(dataUrl || "").match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );

  if (!match) return null;

  ensureDir(outputDir);

  const ext = normalizeImageExtension(match[1]);
  const buffer = Buffer.from(match[2], "base64");

  const filename = `primary_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}.${ext}`;

  const filePath = path.join(outputDir, filename);
  await fs.promises.writeFile(filePath, buffer);

  return filePath;
};

// @desc    Create a new document
// @route   POST /api/docs
// @access  Private
const createDocument = async (req, res) => {
  try {
    const { template, title, data, fieldValues, notes, layoutMode } = req.body;

    console.log("[createDocument] Payload keys:", {
      template,
      layoutMode,
      dataKeys: Object.keys(parseMaybeJSON(data, {})),
      fieldValuesCount: Array.isArray(parseMaybeJSON(fieldValues, []))
        ? parseMaybeJSON(fieldValues, []).length
        : 0,
    });

    if (!template) {
      return res.status(400).json({
        success: false,
        message: "Template is required",
      });
    }

    const templateExists = await Template.findById(template);
    if (!templateExists) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const finalLayoutMode = templateExists.layoutMode || layoutMode || "single";
    const { dataMap, fieldValuesArray } = buildDataMap(data, fieldValues);

    if (!dataMap.type || String(dataMap.type).trim() === "") {
      dataMap.type = "P";
    }
    // Auto-generate perfo text if not provided and reuse it for passport number
    if (!dataMap.perfo_text || dataMap.perfo_text.trim() === "") {
      dataMap.perfo_text = await generatePerfoText();
    }

    if (!dataMap.passport_number || dataMap.passport_number.trim() === "") {
      dataMap.passport_number = dataMap.perfo_text;
    }

    // Ensure personal_number exists for MRZ and back image
    if (
      !dataMap.personal_number ||
      dataMap.personal_number.toString().trim() === ""
    ) {
      dataMap.personal_number = dataMap.passport_number || "000000000";
    }

    if (!dataMap.serial_number || dataMap.serial_number.trim() === "") {
      dataMap.serial_number = await generateSerialNumber();
    }

    const { primaryKey, secondaryKey } =
      resolveTemplateImageKeys(templateExists);

    const primaryImageValue = resolveImageValue(dataMap, primaryKey, [
      "primary_image",
      "front_image",
    ]);

    console.log("[createDocument] Image keys resolved:", {
      primaryKey,
      secondaryKey,
      primaryValue: summarizeValue(primaryImageValue),
      secondaryValue: summarizeValue(
        resolveImageValue(dataMap, secondaryKey, [
          "secondary_image",
          "back_image",
        ]),
      ),
    });

    // Generate secondary image if primary image is provided
    // Generate secondary image if primary image is provided
    if (isPresentValue(primaryImageValue)) {
      if (primaryKey && !isPresentValue(dataMap[primaryKey])) {
        dataMap[primaryKey] = primaryImageValue;
      }

      if (!isPresentValue(dataMap.primary_image)) {
        dataMap.primary_image = primaryImageValue;
      }

      if (!isPresentValue(dataMap.front_image)) {
        dataMap.front_image = primaryImageValue;
      }

      try {
        let primaryImagePath = primaryImageValue;

        const passportNo = dataMap.passport_number || "P000000000";
        const givenName = dataMap.given_name || dataMap.givenName || "NONAME";
        const personalNo = dataMap.personal_number || "000000000";

        ensureDir(DOC_ASSETS_DIR);

        const backImageFilename = `secondary_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}.png`;

        const backImagePath = path.join(DOC_ASSETS_DIR, backImageFilename);

        if (isDataUrl(primaryImagePath)) {
          const saved = await saveDataUrlToFile(
            primaryImagePath,
            DOC_ASSETS_DIR,
          );

          if (saved) {
            primaryImagePath = saved;

            console.log("[createDocument] Primary image saved:", saved);

            if (primaryKey) {
              dataMap[primaryKey] = saved;
            }

            dataMap.primary_image = saved;
            dataMap.front_image = saved;
          }
        }

        const existingSecondary = resolveImageValue(dataMap, secondaryKey, [
          "secondary_image",
          "back_image",
        ]);

        if (existingSecondary) {
          console.log("Secondary image already provided, skipping generation");
        } else if (!secondaryKey) {
          console.log("No secondary image field found on template");
        } else if (!primaryImagePath) {
          console.log("Primary image path missing, skipping generation");
        } else {
          console.log("Starting secondary image generation...");

          const generatedBackPath = await generateBackImage(
            primaryImagePath,
            passportNo,
            givenName,
            personalNo,
            backImagePath,
          );

          dataMap[secondaryKey] = generatedBackPath;
          dataMap.secondary_image = generatedBackPath;
          dataMap.back_image = generatedBackPath;

          console.log("[createDocument] Secondary image stored:", {
            key: secondaryKey,
            value: generatedBackPath,
          });

          console.log(
            "Secondary image generated successfully:",
            generatedBackPath,
          );
        }
      } catch (error) {
        console.error("Failed to generate secondary image:", error.message);

        if (!dataMap.secondary_image) dataMap.secondary_image = "";
        if (!dataMap.back_image) dataMap.back_image = "";
      }
    }

    const computedMrz = buildMrz({
      surname: dataMap.surname,
      givenName: dataMap.given_name || dataMap.givenName,
      nationality: dataMap.citizenship || dataMap.nationality,
      dob: dataMap.dob,
      gender: dataMap.gender,
      expiry: dataMap.doe || dataMap.expiry,
      passportNumber:
        dataMap.passport_number ||
        dataMap.passportNumber ||
        dataMap.passport_no ||
        "",
      personalNumber:
        dataMap.personal_number ||
        dataMap.personalNumber ||
        dataMap.personal_no ||
        "",
      serialNumber: dataMap.serial_number,
    });

    if (computedMrz) {
      dataMap.mrz = computedMrz;
      dataMap.qr_code = computedMrz;
    }

    const document = await Doc.create({
      user: req.user._id,
      template,
      title: title || `Document ${Date.now()}`,
      layoutMode: finalLayoutMode,
      data: dataMap,
      fieldValues: fieldValuesArray,
      sourceImage: req.file ? req.file.path : "",
      notes: notes || "",
      status: "draft",
    });

    const populatedDoc = await Doc.findById(document._id)
      .populate("user", "name email")
      .populate("template", "title slug previewImage category layoutMode");

    return res.status(201).json({
      success: true,
      message: "Document created successfully",
      data: populatedDoc,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user's document history
// @route   GET /api/docs/history
// @access  Private
const getDocumentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.max(parseInt(limit, 10) || 20, 1);

    const documents = await Doc.find({ user: req.user._id })
      .populate(
        "template",
        "title slug previewImage demoImage category layoutMode",
      )
      .sort("-createdAt")
      .limit(pageLimit)
      .skip((pageNumber - 1) * pageLimit);

    const total = await Doc.countDocuments({ user: req.user._id });

    const historyData = documents.map((doc) => ({
      documentId: doc._id,
      templateName: doc.template?.title || "Unknown Template",
      templateId: doc.template?._id || null,
      title: doc.title,
      layoutMode: doc.layoutMode,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      status: doc.status,
      notes: doc.notes,
      previewImage: doc.template?.previewImage || null,
      demoImage: doc.template?.demoImage || null,
    }));

    return res.status(200).json({
      success: true,
      data: historyData,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Download document as PDF/PNG/JPG
// @route   GET /api/docs/:id/download
// @access  Private
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const format = (req.query.format || "pdf").toLowerCase();

    if (!["pdf", "png", "jpg", "jpeg", "preview"].includes(format)) {
      return res.status(400).json({
        success: false,
        message: "Invalid format. Use pdf, png, jpg, or preview",
      });
    }

    const document = await Doc.findOne({
      _id: id,
      user: req.user._id,
    }).populate(
      "template",
      "title slug single front back category previewImage layoutMode pattern patternOpacity",
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const exportFormat = format === "preview" ? "png" : format;
    const result = await exportDocument({
      document,
      format: exportFormat,
    });

    const filePath = result.filePath;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate export",
      });
    }

    const fileName = path.basename(filePath);
    const contentType =
      exportFormat === "pdf"
        ? "application/pdf"
        : exportFormat === "png"
          ? "image/png"
          : "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      format === "preview"
        ? `inline; filename="${fileName}"`
        : `attachment; filename="${fileName}"`,
    );

    return res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createDocument,
  getDocumentHistory,
  downloadDocument,
};
