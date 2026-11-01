require("dotenv").config();
const { MongoClient } = require("mongodb");

const OWNER_NAME = "BookNook Library";
const OWNER_EMAIL = "library@booknook.com";

const books = [
  // Fiction
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", category: "Fiction", isbn: "9780590353427", copies: 5,
    description: "A boy learns on his eleventh birthday that he is a wizard and starts a new life at Hogwarts School of Witchcraft and Wizardry, where friendship and danger wait." },
  { title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fiction", isbn: "9780547928227", copies: 4,
    description: "Bilbo Baggins, a quiet hobbit, is swept into a quest with thirteen dwarves to win back a mountain treasure guarded by a dragon." },
  { title: "1984", author: "George Orwell", category: "Fiction", isbn: "9780451524935", copies: 3,
    description: "In a world watched by Big Brother, Winston Smith secretly dares to think freely. A powerful warning about control and the truth." },
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", isbn: "9780061120084", copies: 3,
    description: "Seen through the eyes of young Scout Finch, a small-town lawyer defends an innocent man and teaches his children about courage and fairness." },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Fiction", isbn: "9780743273565", copies: 4,
    description: "A mysterious millionaire throws huge parties on Long Island, hoping to win back the love he lost. A sharp story of dreams and money." },
  { title: "Pride and Prejudice", author: "Jane Austen", category: "Fiction", isbn: "9780141439518", copies: 3,
    description: "Elizabeth Bennet and the proud Mr. Darcy must overcome first impressions in this witty classic about family, manners and love." },
  { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", isbn: "9780062315007", copies: 5,
    description: "A young shepherd travels from Spain to the Egyptian desert in search of treasure and learns to follow his own dream." },

  // Science
  { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", isbn: "9780553380163", copies: 3,
    description: "A clear tour of black holes, the Big Bang and the nature of time, written for readers who are not physicists." },
  { title: "Cosmos", author: "Carl Sagan", category: "Science", isbn: "9780345539434", copies: 3,
    description: "A journey through the universe, from the first stars to life on Earth, told with wonder by a famous astronomer." },
  { title: "Astrophysics for People in a Hurry", author: "Neil deGrasse Tyson", category: "Science", isbn: "9780393609394", copies: 4,
    description: "The biggest ideas about the universe explained in short chapters that you can read in a single evening." },
  { title: "The Selfish Gene", author: "Richard Dawkins", category: "Science", isbn: "9780198788607", copies: 2,
    description: "A famous look at evolution from the point of view of the gene, and how it shapes the behavior of living things." },

  // History
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", category: "History", isbn: "9780062316110", copies: 4,
    description: "How did humans come to rule the planet? A bold story of our past, from early hunters to the modern age." },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", category: "History", isbn: "9780393317558", copies: 2,
    description: "An explanation of why some societies grew powerful while others did not, based on geography, farming and disease." },
  { title: "The Diary of a Young Girl", author: "Anne Frank", category: "History", isbn: "9780553296983", copies: 3,
    description: "The real diary of a girl hiding with her family during World War II, full of hope, fear and honest thoughts." },

  // Kids
  { title: "Charlotte's Web", author: "E.B. White", category: "Kids", isbn: "9780064400558", copies: 4,
    description: "A clever spider named Charlotte saves her friend Wilbur the pig with words. A gentle story about loyalty." },
  { title: "Where the Wild Things Are", author: "Maurice Sendak", category: "Kids", isbn: "9780060254926", copies: 3,
    description: "Max sails to an island of wild creatures and becomes their king, but he soon wants to go home." },
  { title: "The Very Hungry Caterpillar", author: "Eric Carle", category: "Kids", isbn: "9780399226908", copies: 5,
    description: "A tiny caterpillar eats his way through a week of food and turns into a beautiful butterfly." },
  { title: "Matilda", author: "Roald Dahl", category: "Kids", isbn: "9780142410370", copies: 4,
    description: "Matilda loves books and has a special gift. She uses her clever mind to stand up to unkind grown-ups." },

  // Others
  { title: "Atomic Habits", author: "James Clear", category: "Others", isbn: "9780735211292", copies: 5,
    description: "A practical guide to building good habits and breaking bad ones, using small changes that grow into big results." },
  { title: "Man's Search for Meaning", author: "Viktor E. Frankl", category: "Others", isbn: "9780807014295", copies: 3,
    description: "A psychiatrist shares his experience in the concentration camps and explains how finding purpose helps people survive." },
];

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("booknook");

  // 1. check every cover first
  const docs = [];
  const now = Date.now();
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const image = `https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg`;
    let ok = false;
    try {
      const res = await fetch(image + "?default=false");
      ok = res.ok;
    } catch (e) {}

    if (!ok) {
      console.log("SKIPPED (no cover found):", b.title);
      continue;
    }

    docs.push({
      title: b.title,
      author: b.author,
      category: b.category,
      image: image,
      description: b.description,
      totalCopies: b.copies,
      availableCopies: b.copies,
      addedByName: OWNER_NAME,
      addedByEmail: OWNER_EMAIL,
      createdAt: new Date(now - i * 60000),
    });
  }

  if (docs.length === 0) {
    console.log("No covers could be checked. Nothing was deleted. Check your internet.");
    await client.close();
    return;
  }

  // 2. delete the old test data
  const delBooks = await db.collection("books").deleteMany({});
  const delBorrows = await db.collection("borrows").deleteMany({});
  console.log("Deleted books:", delBooks.deletedCount, "| Deleted borrows:", delBorrows.deletedCount);

  // 3. add the real books
  const result = await db.collection("books").insertMany(docs);
  console.log("Added real books:", result.insertedCount);

  await client.close();
})();
