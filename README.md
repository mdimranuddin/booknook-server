# 📚 BookNook Server

REST API for **BookNook – A Small Online Library**, built with Express.js and MongoDB.

**Live API:** https://booknook-server-one.vercel.app

**Client repository:** https://github.com/mdimranuddin/booknook-client

**Live site:** https://booknook-client-rho.vercel.app

## API Routes

| Method | Route | Access | What it does |
|---|---|---|---|
| GET | /books | Public | All books (supports `?limit=6`, newest first) |
| GET | /books/:id | Public | One book |
| POST | /books | JWT | Add a book |
| PATCH | /books/:id | JWT, owner only | Update a book |
| DELETE | /books/:id | JWT, owner only | Delete a book |
| POST | /borrows | JWT | Borrow a book (copies go down, no double borrow) |
| GET | /borrows | JWT | Borrows of the logged in user |
| DELETE | /borrows/:id | JWT | Return a book (copies go up) |

## Tech Stack

Express.js, MongoDB, JWT verification with jose, deployed on Vercel.

## Run Locally

```bash
npm install
npm run dev
```

Create a `.env` file with your own `MONGODB_URI`, `PORT` and `AUTH_BASE_URL`.
