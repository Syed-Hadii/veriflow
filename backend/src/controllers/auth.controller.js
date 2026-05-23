const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email and include password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin.",
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update user profile (name and/or password)
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, currentPassword, newPassword } = req.body;

    // Build update object
    const updateFields = {};

    // Handle name update
    if (name && name.trim() !== "") {
      updateFields.name = name.trim();
    }

    // Handle password update
    if (newPassword) {
      // Check if current password is provided
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to update password",
        });
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      // Get user with password field
      const user = await User.findById(userId).select("+password");

      // Verify current password
      const isPasswordMatch = await user.matchPassword(currentPassword);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password (will be handled by pre-save middleware)
      updateFields.password = newPassword;
    }

    // Check if any field to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide name or new password to update",
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true, // Return updated document
      runValidators: true, // Run validation
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// You'll need to require jwt at the top of controller file
const jwt = require("jsonwebtoken");

module.exports = {
  signup,
  login,
  updateProfile,
  getMe,
};
