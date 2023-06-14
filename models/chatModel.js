const mongoose = require("mongoose");
const { isEmail } = require("validator"); // the email destructing is an out of the box made email to check with the validator
const bcrypt = require("bcrypt");
const autoIncrement = require("mongoose-sequence")(mongoose);

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    // name: { type: String},
    chatid: {
      type: Number,
      // unique: true,
      // required: true,
      // default: 1,
    },
    adminmails: {
      messages: [],
    },
    admin: {
      type: String,
      default: "devyehia@gmail.com",
    },
    clientmails: {
      messages: [],
      // messages: { type: {}, default: "start" },
    },
    client: {
      type: String,
    },
    opened: {
      type: Boolean,
      default: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    joined: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: "",
    },
    markedformanger: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
  { _id: false }
);

chatSchema.plugin(autoIncrement, { inc_field: "chatid" });

// UserSchema.plugin(autoIncrement);
// UserSchema.pre("save", function (next) {
//     let doc = this;
//     sequencing.getSequenceNextValue("user_id").
//     then(counter => {
//         console.log("asdasd", counter);
//         if(!counter) {
//             sequencing.insertCounter("user_id")
//             .then(counter => {
//                 doc._id = counter;
//                 console.log(doc)
//                 next();
//             })
//             .catch(error => next(error))
//         } else {
//             doc._id = counter;
//             next();
//         }
//     })
//     .catch(error => next(error))
// });

module.exports = mongoose.model("Chat", chatSchema);
