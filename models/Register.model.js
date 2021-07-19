const mongoose = require("mongoose");

const RegisterSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    requied: true,
  },
  email: {
    type: String,
    unique: true,
    requied: true,
  },
  password: {
    type: String,
    requied: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

exports.module = Register = mongoose.model("Register", RegisterSchema);
