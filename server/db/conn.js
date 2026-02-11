const { MongoClient, ObjectId } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

let db;


async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("csprep_db");
    console.log("✅ MongoDB Connected Successfully");
  }
  return db;
}


async function addUser(userData) {
  try {
    const database = await connectDB();
    const users = database.collection("users");

    const existingUser = await users.findOne({ email: userData.email });
    if (existingUser) {
      return { status: "failed", message: "User already exists" };
    }

    await users.insertOne(userData);
    return { status: "success", message: "User registered successfully" };

  } catch (error) {
    return { status: "error", message: error.message };
  }
}


async function checkUser(loginData) {
  try {
    const database = await connectDB();
    const users = database.collection("users");

    const user = await users.findOne(loginData);

    if (!user) {
      return { status: "failed", message: "Invalid username or password" };
    }

    return { status: "success", username: user.username };

  } catch (error) {
    return { status: "error", message: error.message };
  }
}

async function createdefaultexam(id, rstr) {
  try {
    const database = await connectDB();
    const questionsCollection = database.collection("questions");

    if (id !== "CUSTOM") {
      return await questionsCollection
        .find({ Qid: new RegExp(id, "i") })
        .toArray();
    } else {
      let questions = [];

      for (let topic of rstr) {
        const result = await questionsCollection
          .find({ Topic: topic.name })
          .limit(parseInt(topic.value))
          .toArray();

        questions.push(...result);
      }

      return questions;
    }
  } catch (error) {
    return { status: "error", message: error.message };
  }
}


async function sendExamData(eid, rand, email) {
  try {
    const database = await connectDB();
    const exams = database.collection("exams");

    let rstr = [];
    if (eid === "CUSTOM") {
      rstr = JSON.parse(rand);
    }

    const examData = {
      eid,
      rstr,
      email,
      starttime: Date.now(),
      endtime: "",
      answers: []
    };

    const result = await exams.insertOne(examData);

    return result.insertedId.toString();

  } catch (error) {
    return { status: "error", message: error.message };
  }
}


async function searchexamid(id) {
  try {
    const database = await connectDB();
    const exams = database.collection("exams");

    return await exams
      .find({ _id: new ObjectId(id) })
      .toArray();

  } catch (error) {
    return { status: "error", message: error.message };
  }
}


async function saveAnswers(id, ans) {
  try {
    const database = await connectDB();
    const exams = database.collection("exams");

    await exams.updateOne(
      { _id: new ObjectId(id) },
      { $push: { answers: ans } }
    );

    return { status: "success" };

  } catch (error) {
    return { status: "error", message: error.message };
  }
}


async function sendResponse(id) {
  try {
    const database = await connectDB();
    const exams = database.collection("exams");

    await exams.updateOne(
      { _id: new ObjectId(id) },
      { $set: { endtime: Date.now() } }
    );

    return await exams
      .find({ _id: new ObjectId(id) })
      .toArray();

  } catch (error) {
    return { status: "error", message: error.message };
  }
}

module.exports = {
  connectDB,
  addUser,
  checkUser,
  createdefaultexam,
  sendExamData,
  searchexamid,
  saveAnswers,
  sendResponse
};
