const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    summary: { type: String },
    type: { type: String },
    description: { type: String },
    numberofitem: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
