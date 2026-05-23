const fs = require("fs");
const path = require("path");

// ================================
// CONFIG
// ================================

const API_URL = "http://localhost:5000/api/docs";

// Isko run karte waqt ya yahan manually update kar sakte ho
const TEMPLATE_ID = "6a0f756dea8b20bd7a59901c";

// Agar auth middleware enabled hai to token required hoga
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE3NzU3NzQ3OTI2NTciLCJlbWFpbCI6InN5ZWRhYmR1bGhhZGlpaTM2QGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc1Nzc0NzkyLCJleHAiOjE3NzYzNzk1OTJ9.cOQLKDyC82E6_wFZMrBleqxAIys-U6Dbj7iXeFA4npI";

const PRIMARY_IMAGE_PATH = "E:/My Documents/Documents/hadi.jpg";

const SIGNATURE_IMAGE_PATH = "C:/Users/ahadi/OneDrive/Desktop/signature.png";

// ================================
// HELPERS
// ================================

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";

  throw new Error(`Unsupported image type: ${ext}`);
};

const fileToDataUrl = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const mimeType = getMimeType(filePath);
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");

  return `data:${mimeType};base64,${base64}`;
};

// ================================
// MAIN
// ================================

const createDocument = async () => {
  try {
    const primaryImageDataUrl = fileToDataUrl(PRIMARY_IMAGE_PATH);
    const signatureDataUrl = fileToDataUrl(SIGNATURE_IMAGE_PATH);

    const payload = {
      template: TEMPLATE_ID,
      title: "Passport Template",
      layoutMode: "single",
      fieldValues: [],
      data: {
        authority: "PPA",
        citizenship: "EST",
        dob: "2026-05-22",
        doe: "2026-05-22",
        gender: "M/M",
        given_name: "ALL PSD",
        issue_date: "2026-05-22",
        issuing_country: "EST",
        personal_number: "34645454",
        pob: "EESTI/EST",
        primary_image: primaryImageDataUrl,
        signature: signatureDataUrl,
        surname: "TEMPLATES",
      },
    };

    console.log("[test-create-document] Sending request...");
    console.log("[test-create-document] API:", API_URL);
    console.log("[test-create-document] Template:", TEMPLATE_ID);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        // Agar token required nahi hai to ye line hata sakte ho
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const resultText = await response.text();

    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = resultText;
    }

    console.log("[test-create-document] Status:", response.status);
    console.log("[test-create-document] Response:");
    console.dir(result, { depth: null });

    if (!response.ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("[test-create-document] Failed:", error.message);
    process.exitCode = 1;
  }
};

createDocument();
