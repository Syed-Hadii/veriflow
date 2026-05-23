const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    prefix: { type: String, default: "" },
    width: { type: Number, default: 0 },
    value: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sequence", sequenceSchema);
