const mongoose = require("mongoose");

const AssignTaskSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    
  },
  assigntask: {
    type: String,
    required: true,
  },
  assigneduser: {
    type: String,
    reuired: true,
  },
  state: {
    type: String,
    enum: ["Todo", "Doing", "Done"],
    default: "Todo",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = AssignTask = mongoose.model("assigntask", AssignTaskSchema);
