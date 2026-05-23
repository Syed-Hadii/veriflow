const express = require("express");
const docRouter = express.Router();
const {
  createDocument,
  getDocumentHistory,
  downloadDocument,
} = require("../controllers/document.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadSingle } = require("../middleware/upload.middleware");

// All routes are protected
docRouter.post("/", protect, uploadSingle, createDocument);
docRouter.get("/history", protect, getDocumentHistory);
docRouter.get("/:id/download", protect, downloadDocument);

module.exports = docRouter;
