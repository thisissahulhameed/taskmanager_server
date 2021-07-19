const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const emailValidator = require("email-validator");
const port = process.env.PORT || 9000;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Register = require("./models/Register.model");
const MyTask = require("./models/Task.model");
const AssignTask = require("./models/AssignTask.model");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.na8ex.mongodb.net/DuplicateTaskManager?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Db connected successfully");
  })
  .catch((error) => {
    console.log(error);
  });

// Register
app.post("/register", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const password2 = req.body.password2;
  console.log(username, email, password, password2);
  if (!username) {
    res.send("username is required", 404);
  } else if (!email) {
    res.send("email is required", 404);
  } else if (!password) {
    res.send("password is required", 404);
  } else if (!password2) {
    res.send("confirm password is required", 404);
  } else if (password.toString().length < 8) {
    res.send("password must be greater than 8 characters", 404);
  } else if (password !== password2) {
    res.send("password must match with confirm password", 404);
  } else {
    const newUser = Register({
      username: username,
      email: emailValidator.validate(email)
        ? email
        : res.send("invalid email", 404),
      password: await bcrypt.hash(password, 10),
    });
    newUser
      .save()
      .then((user) => res.send(user))
      .catch((error) => {
        if (error.message.includes("username")) {
          res.send("username has been taken", 404);
        } else if (error.message.includes("email")) {
          res.send("email has been taken", 404);
        }
      });
  }
});

function generateToken(username, password) {
  return jwt.sign(
    { username: username, password: password },
    process.env.SECRET_TOKEN,
    { expiresIn: "604800s" }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.send("authentication failed", 404);
  }

  jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
    if (err) console.log(err);
    else {
      req.user = user;
      next();
    }
  });
}

// login
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log({ username: username, password: password });
  if (!username) {
    res.send("username is required", 404);
  } else if (!password) {
    res.send("password is required", 404);
  } else {
    Register.findOne({ username: username })
      .then(async (user) => {
        if (!user) {
          res.send("No user found with this name", 404);
        } else if (!(await bcrypt.compare(password, user.password))) {
          res.send("password does not match with the username", 404);
        } else {
          const AccessToken = generateToken(username, password);
          res.json({ accessToken: AccessToken });
        }
      })
      .catch((err) => console.log(err));
  }
});

// getting all users
app.get("/allusers", authenticateToken, (req, res) => {
  Register.find()
    .then((user) => {
      res.json(user);
    })
    .catch((err) => console.log(err));
});

// creating own task
app.post("/createmytask", authenticateToken, (req, res) => {
  const username = req.user.username;
  const task = req.body.task;
  if (!task) {
    res.send("Task is required", 404);
  }
  const newTask = new MyTask({
    username: username,
    task: task,
  });
  
  newTask
    .save()
    .then((task) => {
      res.json(task);
    })
    .catch((error) => {
      console.log(error);
    });
});

// assigning task to others
app.post("/assigntask", authenticateToken, (req, res) => {
  console.log(req.body);
  const username = req.user.username;
  const assigntask = req.body.assigntask;
  const assigneduser = req.body.assigneduser;

  if (!assigntask) {
    res.send("Task is required", 404);
  }
  if (!assigneduser) {
    res.send("Assigned  User is required", 404);
  }
  const newAssignTask = new AssignTask({
    username: username,
    assigntask: assigntask,
    assigneduser: assigneduser,
  });
  newAssignTask
    .save()
    .then((task) => {
      res.json(task);
    })
    .catch((error) => {
      console.log(error);
    });
});

// get all own task
app.get("/allmytask", authenticateToken, (req, res) => {
  MyTask.find({ username: req.user.username })
    .then((alltask) => res.json(alltask))
    .catch((err) => {
      console.log(err);
    });
});

// edit my task
app.put("/updatemytask/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const task = req.body.task;
  const state = req.body.state;
  MyTask.findByIdAndUpdate(
    { _id: id },
    {
      task: task,
      state: state,
    }
  )
    .then((task) => res.json(task))
    .catch((err) => console.log(err));
});

// delete my task
app.delete("/deletemytask/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  MyTask.findByIdAndRemove({ _id: id })
    .then(() => res.send("deleted successfully"))
    .catch((err) => console.log(err));
});

// assign all task
app.get("/allassigntask", authenticateToken, (req, res) => {
  AssignTask.find({ username: req.user.username })
    .then((task) => res.json(task))
    .catch((err) => console.log(err));
});

app.get("/allassignedtask", authenticateToken, (req, res) => {
  AssignTask.find({ assigneduser: req.user.username })
    .then((task) => res.json(task))
    .catch((err) => console.log(err));
});


app.put("/updateassigntask/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const assigntask = req.body.assigntask;
  const state = req.body.state;
  AssignTask.findByIdAndUpdate(
    { _id: id },
    {
      assigntask: assigntask,
      state: state,
    }
  )
    .then((task) => res.send(task))
    .catch((err) => console.log(err));
});

app.listen(port, () => {
  console.log(`server started successfully at http://localhost:${port} `);
});
