require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db("booknook");
const booksCollection = db.collection("books");
const borrowsCollection = db.collection("borrows");

app.get("/", (req, res) => {
  res.send("BookNook server is running");
});

// GET /books - all books (newest first)
app.get("/books", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const books = await booksCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    res.send(books);
  } catch (error) {
    res.status(500).send({ message: "Failed to get books" });
  }
});

// GET /books/:id - one book
app.get("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book id" });
    }
    const book = await booksCollection.findOne({ _id: new ObjectId(id) });
    if (!book) {
      return res.status(404).send({ message: "Book not found" });
    }
    res.send(book);
  } catch (error) {
    res.status(500).send({ message: "Failed to get the book" });
  }
});

app.listen(port, () => {
  console.log(`BookNook server running on port ${port}`);
});

module.exports = app;
