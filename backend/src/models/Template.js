const mongoose = require("mongoose");

const elementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "text",
        "textarea",
        "number",
        "date",
        "email",
        "phone",
        "address",
        "image",
        "qr",
        "barcode",
        "signature",
        "custom",
      ],
      default: "text",
    },
    side: {
      type: String,
      enum: ["single", "front", "back"],
      default: "single",
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      rotation: { type: Number, default: 0 },
    },
    style: {
      fontSize: { type: Number, default: 16 },
      fontFamily: { type: String, default: "Tahoma" },
      fontWeight: { type: String, default: "400" },
      color: { type: String, default: "#000000" },
      textAlign: {
        type: String,
        enum: ["left", "center", "right"],
        default: "left",
      },
      textBaseline: {
        type: String,
        enum: ["top", "middle", "bottom", "alphabetic"],
        default: "bottom",
      },
      opacity: { type: Number, default: 1 },
      lineHeight: { type: Number, default: null },
      vertical: { type: Boolean, default: false },
      fakeBold: { type: Boolean, default: false },
      strokeWidth: { type: Number, default: 0.3 },
      letterSpacing: Number,
      firstLineOffsetY: Number,
      secondLineOffsetY: Number,
      anchorLastLine: { type: Boolean, default: false },
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "",
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    showInForm: {
      type: Boolean,
      default: true,
    },
    render: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const pageSchema = new mongoose.Schema(
  {
    backgroundImage: {
      type: String,
      default: "",
    },
    width: {
      type: Number,
      default: 1000,
    },
    height: {
      type: Number,
      default: 600,
    },
    elements: [elementSchema],
  },
  { _id: false },
);

const templateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "document",
    },
    layoutMode: {
      type: String,
      enum: ["single", "dual"],
      default: "single",
    },
    previewImage: {
      type: String,
      default: "",
    },
    demoImage: {
      type: String,
      default: "",
    },
    pattern: {
      type: String,
      default: "",
    },
    patternOpacity: {
      type: Number,
      default: 0.5,
    },
    single: {
      type: pageSchema,
      default: {},
    },
    front: {
      type: pageSchema,
      default: {},
    },
    back: {
      type: pageSchema,
      default: {},
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Template", templateSchema);
