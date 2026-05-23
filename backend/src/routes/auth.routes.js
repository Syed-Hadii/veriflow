const express = require("express");
const authRouter = express.Router();
const {
  signup,
  login,
  updateProfile,
  getMe,
} = require("../controllers/auth.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

// Public routes
authRouter.post("/signup", signup);
authRouter.post("/login", login);

// Protected routes
authRouter.get("/me", protect, getMe);
authRouter.put("/profile", protect, updateProfile);

module.exports = authRouter;
