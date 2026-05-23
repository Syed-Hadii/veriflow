const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/auth");
const historyController = require("../controllers/historyController");

router.get("/", protect, authorizeRoles("admin"), historyController.getHistory);
router.post("/", protect, historyController.createHistory);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  historyController.deleteHistory,
);

module.exports = router;
