const mongoose = require("mongoose");
const autoIncrement = require("mongoose-sequence")(mongoose);

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    ordernumber: {
      type: Number,
      // unique: true,
      // required: true,
      // default: 1,
    },
    orderProducts: { type: [], required: true },
    orderTotalValue: { type: Number, required: true },
    user: { type: String, required: true },
    userData: { type: Object },
    mailSent: { type: Boolean, default: false },
    opened: { type: Boolean, default: true },
    note: { type: String, default: "none" },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  next(); // this pointing to the function which is pointing to the document being saved
});

orderSchema.plugin(autoIncrement, { inc_field: "ordernumber", startAt: 1000 });

module.exports = mongoose.model("Order", orderSchema);
