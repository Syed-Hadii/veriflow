const mongoose = require("mongoose");

const elementValueSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false },
);

const docSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    layoutMode: {
      type: String,
      enum: ["single", "dual"],
      default: "single",
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fieldValues: [elementValueSchema],
    sourceImage: {
      type: String,
      default: "",
    },
    generatedFiles: {
      pdf: {
        type: String,
        default: "",
      },
      png: {
        type: String,
        default: "",
      },
      jpg: {
        type: String,
        default: "",
      },
      front: {
        type: String,
        default: "",
      },
      back: {
        type: String,
        default: "",
      },
    },
    attachments: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "generated", "published", "archived"],
      default: "draft",
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Doc", docSchema);
