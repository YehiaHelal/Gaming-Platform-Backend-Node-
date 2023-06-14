const mongoose = require("mongoose");
const { isEmail } = require("validator"); // the email destructing is an out of the box made email to check with the validator
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const contactSchema = new Schema(
  {
    // name: { type: String, required: true },
    email: {
      type: String,
      validate: [isEmail, "please enter a valid email"],
    },
    contact: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
