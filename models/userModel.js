const mongoose = require("mongoose");
const { isEmail } = require("validator"); // the email destructing is an out of the box made email to check with the validator
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    // name: { type: String, required: true },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
      lowercase: true,
      // validate: [isEmail, "please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "please enter an password"],
      minlength: [6, "Minimum password length is 6 characters"], // make sure this is lowercase minlength vs minLength
    },
    address: {
      type: String,
    },
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    mobilenumber: { type: Number, default: "01234567890" },
    active: { type: Boolean, default: true },
    note: { type: String, default: "none" },
  },
  { timestamps: true }
);

// fire a fucntion before a doc saved to the db
userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next(); // this pointing to the function which is pointing to the document being saved
});

//fire a function after a doc saved to the db
// userSchema.post("save", function (doc, next) {
//   console.log("new user was created and saved", doc);
//   next(); // pre and post method to do things before or after
// });

module.exports = mongoose.model("User", userSchema);
