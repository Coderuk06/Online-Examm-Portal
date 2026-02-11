const express = require("express");
const app = express();
const conn = require("./db/conn.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const path = require("path");

const PORT = 3000;
const oneDay = 1000 * 60 * 60 * 24;

// ================= SESSION =================
app.use(
  sessions({
    secret: "Gla2023",
    saveUninitialized: true,
    resave: false,
    cookie: { maxAge: oneDay },
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files correctly
app.use(express.static(path.join(__dirname, "../client")));

/////////////////////// ROUTES ///////////////////////

// HOME PAGE
app.get("/", (req, res) => {
  if (req.session.username) {
    return res.redirect("/Home");
  }
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// FAQ
app.get("/faq", (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  res.sendFile(path.join(__dirname, "../client/faq.html"));
});

// PROFILE
app.get("/profile", (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  res.sendFile(path.join(__dirname, "../client/profile.html"));
});

// DASHBOARD HOME
app.get("/Home", (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  res.sendFile(path.join(__dirname, "../client/Home.html"));
});

//////////////////// RESULT DATA ////////////////////

let rdata = {};

app.post("/setResultData", (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  rdata = req.body;
  res.sendStatus(200);
});

app.get("/Result", (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  res.sendFile(path.join(__dirname, "../client/Result.html"));
});

app.get("/getResultData", (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  res.json(rdata);
});

//////////////////// AUTH ////////////////////

app.post("/register", async (req, res) => {
  let data = req.body;
  data["_id"] = data["email"];
  delete data["email"];

  const result = await conn.addUser(data);

  if (result.status === "success") {
    return res.status(200).json(result);
  }
  res.status(400).json(result);
});

app.post("/login", async (req, res) => {
  let data = req.body;
  data["_id"] = data["email"];
  delete data["email"];

  const resp = await conn.checkUser(data);

  if (resp.status === "success") {
    req.session.username = data["_id"];
    return res.status(200).json(resp);
  }

  res.status(400).json(resp);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

//////////////////// EXAM ////////////////////

app.get("/takeexam", async (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  const eid = req.query.eid;
  let rand = {};

  if (eid === "CUSTOM") {
    rand = req.query.randomstring;
    if (!rand) return res.redirect("/");
  }

  const examId = await conn.sendExamData(
    eid,
    rand,
    req.session.username
  );

  req.session.examid = examId;

  res.sendFile(path.join(__dirname, "../client/exam.html"));
});

app.get("/data", async (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  const results = await conn.searchexamid(
    req.session.examid
  );

  const examdata = await conn.createdefaultexam(
    results[0]["eid"],
    results[0]["rstr"]
  );

  res.json(examdata);
});

app.get("/submitQuestion", async (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  await conn.saveAnswers(
    req.session.examid,
    req.query
  );

  res.sendStatus(200);
});

app.post("/submitPaper", async (req, res) => {
  if (!req.session.username)
    return res.redirect("/");

  const result = await conn.sendResponse(
    req.session.examid
  );

  res.json(result);
});

//////////////////// SERVER ////////////////////

app.listen(PORT, () => {
  console.log(
    ` Server running at http://localhost:${PORT}`
  );
});
