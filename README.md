# 📚 BookNook Server

![Express](https://img.shields.io/badge/Express.js-API-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Security-JWT-F59E0B)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

> ⚙️ The REST API behind **BookNook – A Small Online Library**.
> It stores books and borrows, and protects every write action with a JWT check.

## 🔗 Links

| | |
|---|---|
| ⚙️ **Live API** | https://booknook-server-one.vercel.app |
| 🌐 **Live Site** | https://booknook-client-rho.vercel.app |
| 💻 **Client Repository** | https://github.com/mdimranuddin/booknook-client |

## 🛣️ API Routes

| Method | Route | Access | What it does |
|---|---|---|---|
| `GET` | `/books` | 🌍 Public | All books, newest first (`?limit=6` for the Home page) |
| `GET` | `/books/:id` | 🌍 Public | One book |
| `POST` | `/books` | 🔒 JWT | Add a book |
| `PATCH` | `/books/:id` | 🔒 JWT, owner only | Update a book |
| `DELETE` | `/books/:id` | 🔒 JWT, owner only | Delete a book |
| `POST` | `/borrows` | 🔒 JWT | Borrow a book (copies go down, no double borrow) |
| `GET` | `/borrows` | 🔒 JWT | Borrows of the logged in user |
| `DELETE` | `/borrows/:id` | 🔒 JWT | Return a book (copies go up) |

## ✨ Highlights

- 🔑 **JWT verification:** every protected route checks the token, and the user's email comes from the token, so nobody can fake it
- 👑 **Owner-only edits:** only the person who added a book can update or delete it
- 📦 **Copies with `$inc`:** borrowing lowers the copies by 1 and returning raises them by 1, and a book with 0 copies cannot be borrowed
- 🚫 **No double borrow:** the same user cannot borrow the same book twice at the same time
- 🌱 **Seed script:** `seed.js` fills the library with real books and covers

## 🗄️ Data

📖 **books**

```json
{
  "title": "", "author": "", "category": "", "image": "", "description": "",
  "totalCopies": 3, "availableCopies": 3,
  "addedByName": "", "addedByEmail": "", "createdAt": "date"
}
```

🤝 **borrows**

```json
{
  "bookId": "", "bookTitle": "", "bookImage": "",
  "userName": "", "userEmail": "",
  "borrowDate": "date", "returnDate": "date"
}
```

## 🧰 Tech Stack

| Area | Tools |
|---|---|
| ⚙️ **Server** | Express.js, CORS, dotenv |
| 🗄️ **Database** | MongoDB (official driver) |
| 🔐 **Security** | JWT verification with `jose` and the client's public keys |
| ☁️ **Hosting** | Vercel |

## 🚀 Run Locally

```bash
git clone https://github.com/mdimranuddin/booknook-server.git
cd booknook-server
npm install
npm run dev
```

Create a `.env` file with your own values:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
AUTH_BASE_URL=http://localhost:3000
```

`AUTH_BASE_URL` is the address of the BookNook client. The server uses it to find the keys that verify the tokens.

> ⚠️ `node seed.js` **deletes all books and borrows** before adding the sample books. Run it only on a fresh or test database.

## 👨‍💻 Author

**Mohammad Imran Uddin**
🐙 GitHub: [@mdimranuddin](https://github.com/mdimranuddin)

Built as a learning project for the Programming Hero Full Stack Web Engineering course. 💜
