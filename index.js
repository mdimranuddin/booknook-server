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

// ---------- JWT check ----------
let jwks;
const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).send({ message: "Unauthorized: no token" });
    }

    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    if (!jwks) {
      jwks = createRemoteJWKSet(
        new URL(`${process.env.AUTH_BASE_URL}/api/auth/jwks`)
      );
    }
    const { payload } = await jwtVerify(token, jwks);
    req.user = payload;
    next();
  } catch (error) {
    console.log("JWT error:", error.message);
    res.status(401).send({ message: "Unauthorized: invalid token" });
  }
};

app.get("/", (req, res) => {
  res.send("BookNook server is running");
});

// ---------- BOOKS ----------

// GET /books - all books (public, newest first)
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

// POST /books - add a book (protected)
app.post("/books", verifyToken, async (req, res) => {
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
      addedByName: req.user.name,
      addedByEmail: req.user.email,
      createdAt: new Date(),
    };

    const result = await booksCollection.insertOne(newBook);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add the book" });
  }
});

// PATCH /books/:id - update a book (protected, owner only)
app.patch("/books/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book id" });
    }
    const { title, author, category, image, description } = req.body;

    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id), addedByEmail: req.user.email },
      { $set: { title, author, category, image, description } }
    );
    if (result.matchedCount === 0) {
      return res
        .status(403)
        .send({ message: "You can only edit your own books" });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update the book" });
  }
});

// DELETE /books/:id - delete a book (protected, owner only)
app.delete("/books/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book id" });
    }
    const result = await booksCollection.deleteOne({
      _id: new ObjectId(id),
      addedByEmail: req.user.email,
    });
    if (result.deletedCount === 0) {
      return res
        .status(403)
        .send({ message: "You can only delete your own books" });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete the book" });
  }
});

// ---------- BORROWS ----------

// POST /borrows - borrow a book (protected)
app.post("/borrows", verifyToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userEmail = req.user.email;
    const userName = req.user.name;

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

// GET /borrows - borrows of the logged in user (protected)
app.get("/borrows", verifyToken, async (req, res) => {
  try {
    const borrows = await borrowsCollection
      .find({ userEmail: req.user.email })
      .sort({ borrowDate: -1 })
      .toArray();
    res.send(borrows);
  } catch (error) {
    res.status(500).send({ message: "Failed to get borrows" });
  }
});

// DELETE /borrows/:id - return a book (protected, own borrow only)
app.delete("/borrows/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid borrow id" });
    }

    const borrow = await borrowsCollection.findOne({
      _id: new ObjectId(id),
      userEmail: req.user.email,
    });
    if (!borrow) {
      return res.status(404).send({ message: "Borrow not found" });
    }

    // Increase copies by 1
    await booksCollection.updateOne(
      { _id: new ObjectId(borrow.bookId) },
      { $inc: { availableCopies: 1 } }
    );

    const result = await borrowsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to return the book" });
  }
});

app.listen(port, () => {
  console.log(`BookNook server running on port ${port}`);
});

module.exports = app;
