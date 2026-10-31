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

// POST /borrows - borrow a book
app.post("/borrows", async (req, res) => {
  try {
    const { bookId, userEmail, userName } = req.body;

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).send({ message: "Invalid book id" });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
    if (!book) {
      return res.status(404).send({ message: "Book not found" });
    }

    // No double borrow
    const alreadyBorrowed = await borrowsCollection.findOne({
      bookId: bookId,
      userEmail: userEmail,
    });
    if (alreadyBorrowed) {
      return res
        .status(400)
        .send({ message: "You have already borrowed this book" });
    }

    // Decrease copies by 1 only if copies are available
    const updateResult = await booksCollection.updateOne(
      { _id: new ObjectId(bookId), availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } }
    );
    if (updateResult.modifiedCount === 0) {
      return res.status(400).send({ message: "Book is not available" });
    }

    // Return date = 7 days after today
    const borrowDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 7);

    const newBorrow = {
      bookId: bookId,
      bookTitle: book.title,
      bookImage: book.image,
      userName: userName,
      userEmail: userEmail,
      borrowDate: borrowDate,
      returnDate: returnDate,
    };

    const result = await borrowsCollection.insertOne(newBorrow);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to borrow the book" });
  }
});

app.listen(port, () => {
  console.log(`BookNook server running on port ${port}`);
});

module.exports = app;
