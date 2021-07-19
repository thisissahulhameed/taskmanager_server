const mongoose = require("mongoose");

const MyTaskSchema =  mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    enum: ["Todo", "Doing", "Done"],
    default: "Todo",
  },
  date: {
    type: Date,
    default: Date.now
  },
});

module.exports = MyTask = mongoose.model("mytask", MyTaskSchema);
