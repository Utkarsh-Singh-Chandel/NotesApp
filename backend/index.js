const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilitites");
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 5000;
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Connected to mongoDB");
  } catch (error) {
    console.log("Error Connecting to mongo db", error.message);
  }
};

const User = require("./models/user.model");
const Note = require("./models/note.model");

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use(
  cors({
    origin: "*",
  })
);
app.get("/", (req, res) => {
  res.json({ data: "Hello " });
});

app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName) {
    return res
      .status(400)
      .json({ error: true, message: "Full Name is required" });
  }
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  const isUser = await User.findOne({ email: email });
  if (isUser) {
    return res.json({
      error: true,
      message: "User Already Exists!",
    });
  }
  // Hash Passord
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    fullName,
    email,
    password: hashedPassword,
  });
  await user.save();
  const accessToken = jwt.sign({ user }, process.env.JWT_SECRET, {
    expiresIn: "3600m",
  });
  return res.json({
    error: false,
    user,
    accessToken,
    message: "User Registered Successfully",
  });
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required!" });
  }
  const userInfo = await User.findOne({ email: email });
  if (!userInfo) {
    return res.status(400).json({ message: "User does not exist!" });
  }
  const isPasswordCorrect = await bcrypt.compare(
    password,
    userInfo?.password || ""
  );

  if (userInfo.email == email && isPasswordCorrect) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "36000m",
    });
    return res.json({
      error: false,
      message: "Login is successful",
      email,
      accessToken,
    });
  } else {
    return res.json({
      error: true,
      message: "Invalid Username of Password",
    });
  }
});
app.get("/get-user", authenticateToken, async (req, res) => {
  const { user } = req.user;
  const isUser = await User.findOne({
    _id: user._id,
  });
  if (!isUser) {
    return res.sendStatus(401);
  }
  return res.json({
    user: {
      fullName: isUser.fullName,
      email: isUser.email,
      _id: isUser._id,
      createdOn: isUser.createdOn,
    },
    message: "",
  });
});
app.post("/add-note", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;
  if (!title) {
    return res.status(400).json({ error: true, message: "Title is required" });
  }
  if (!content) {
    return res
      .status(400)
      .json({ error: true, message: "Content is required" });
  }
  try {
    const note = new Note({
      title,
      content,
      tags: tags || [],
      userId: user._id,
    });
    await note.save();
    return res.json({
      error: false,
      note,
      message: "Note Added successfully",
    });
  } catch (error) {
    console.log("Error in saving the note ", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;

  if (!title && !content && !tags) {
    return res.status(400).json({
      error: true,
      message: "No Change provided !",
    });
  }
  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) {
      return res.status(404).json({
        error: true,
        message: "Note not found",
      });
    }
    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (isPinned) note.isPinned = isPinned;
    await note.save();
    return res.json({
      error: false,
      note,
      message: "Edited Note Successfully",
    });
  } catch (error) {
    console.log("Error in edit note ", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});
app.get("/get-all-notes", authenticateToken, async (req, res) => {
  const { user } = req.user;
  try {
    const notes = await Note.find({
      userId: user._id,
    }).sort({
      isPinned: -1,
    });
    return res.json({
      error: false,
      notes,
      message:"Notes retrieved successfully!",
    });
  } catch (error) {
    console.log("Error in getting messages", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});
app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
  
  const noteId = req.params.noteId;
  const { user } = req.user;
  try {
    const note = Note.findOne({
      _id: noteId,
      userId: user._id,
    });
    if (!note) {
      return res.status(404).json({
        error: true,
        message: "Note not found",
      });
    }
    await Note.deleteOne({
      _id: noteId,
      userId: user._id,
    });
    return res.status(200).json({
      error: false,
      message: "Note deleted Successfully",
    });
  } catch (error) {
    console.log("Error in delete message", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});
app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;
  try {
    const note = await Note.findOne({
      _id: noteId,
      userId: user._id,
    });
    if (!note) {
      return res.status(404).json({
        error: true,
        message: "Note not found",
      });
    }
    if (isPinned !== undefined) note.isPinned = isPinned;
    await note.save();
    return res.json({
      error: false,
      note,
      message: "Note Pinned Successfully",
    });
  } catch (error) {
    console.log("Error in pinning message", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});
app.get("/search-notes", authenticateToken, async (req, res) => {

  const { user } = req.user;
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({
      error: true,
      message: "Search query is required",
    });
  }
  try {
    const matchingNotes = await Note.find({
      userId: user._id,
      $or: [
        { title: { $regex: new RegExp(query, "i") } },
        { content: { $regex: new RegExp(query, "i") } },
      ],
    });
    return res.json({
      error: false,
      notes: matchingNotes,
      message: "Notes matching found",
    });
  } catch (error) {
    console.log("Error in search noted api", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.listen(PORT, (req, res) => {
  console.log("Server running on Port 5000");
  connectToMongoDB();
});
module.exports = app;
