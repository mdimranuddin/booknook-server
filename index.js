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

// POST /books - add a book
app.post("/books", async (req, res) => {
  try {
    const book = req.body;
    const totalCopies = Number(book.totalCopies) || 1;

    const newBook = {
      title: book.title,
      author: book.author,
      category: book.category,
      image: book.image,
      description: book.description,
      totalCopies: totalCopies,
      availableCopies: totalCopies,
      addedByName: book.addedByName,
      addedByEmail: book.addedByEmail,
      createdAt: new Date(),
    };

    const result = await booksCollection.insertOne(newBook);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add the book" });
  }
});

// PATCH /books/:id - update a book
app.patch("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book id" });
    }
    const { title, author, category, image, description } = req.body;

    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, author, category, image, description } }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update the book" });
  }
});

// DELETE /books/:id - delete a book
app.delete("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book id" });
    }
    const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete the book" });
  }
});

app.listen(port, () => {
  console.log(`BookNook server running on port ${port}`);
});

module.exports = app;
