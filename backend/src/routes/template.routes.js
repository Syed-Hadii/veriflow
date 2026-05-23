const express = require("express");
const templateRouter = express.Router();
const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/template.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

// Public routes
templateRouter.get("/", getTemplates);
templateRouter.get("/:id", getTemplateById);

// Protected routes
templateRouter.post(
  "/",
  protect,
  authorizeRoles("admin", "editor"),
  createTemplate,
);
templateRouter.put(
  "/:id",
  protect,
  authorizeRoles("admin", "editor"),
  updateTemplate,
);
templateRouter.delete("/:id", protect, authorizeRoles("admin"), deleteTemplate);

module.exports = templateRouter;
