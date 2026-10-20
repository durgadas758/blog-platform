# Inkwell — Blog Platform with Comments

A full-stack blogging platform where users can register, write posts, and engage through comments. Built with a dark glassmorphism aesthetic.

![Node.js](https://img.shields.io/badge/Node.js-v24+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=flat&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat)

---

## Features

- **User Authentication** — Register and log in with JWT tokens (7-day expiry)
- **Blog Posts** — Create, edit, and delete posts with a rich inline editor
- **Comments** — Threaded comment section on every post with ownership controls
- **Search** — Real-time post search by title and content
- **Profile Page** — View and manage all your own posts in one place
- **Responsive UI** — Works on desktop, tablet, and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | SQLite via [sql.js](https://github.com/sql-js/sql.js) (WebAssembly — no native compilation) |
| Auth | JWT + bcryptjs |
| Frontend | Vanilla HTML, CSS, JavaScript (SPA) |
| Fonts | Outfit + Inter (Google Fonts) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- No database server required — SQLite runs in-process

### Installation

```bash
# Clone the repository
git clone https://github.com/shhahidd/Blog-Platform-with-Comments.git
cd Blog-Platform-with-Comments

# Install dependencies
npm install

# Start the server
node server.js
```

Open **http://localhost:3000** in your browser.

> The SQLite database file (`database.db`) is created automatically on first run.

---

## Project Structure

```
├── server.js              # Express entry point
├── db.js                  # sql.js database wrapper (mimics better-sqlite3 API)
├── package.json
├── middleware/
│   └── auth.js            # JWT verification middleware
├── routes/
│   ├── auth.js            # /api/auth — register, login, me
│   ├── posts.js           # /api/posts — CRUD + search
│   └── comments.js        # /api/comments — create, delete
└── public/
    ├── index.html         # Single Page Application shell
    ├── css/
    │   └── style.css      # Full design system (dark glassmorphism)
    └── js/
        ├── api.js         # Fetch wrapper with auto token injection
        ├── auth.js        # Auth state management + modal
        ├── posts.js       # Post rendering, editor, profile
        ├── comments.js    # Comment thread + submission
        └── app.js         # Client-side router + toasts + confirm dialogs
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/posts` | — | List all posts (supports `?search=` and `?author=`) |
| `GET` | `/api/posts/:id` | — | Get single post with comments |
| `POST` | `/api/posts` | ✅ | Create a new post |
| `PUT` | `/api/posts/:id` | ✅ Owner | Edit a post |
| `DELETE` | `/api/posts/:id` | ✅ Owner | Delete a post |

### Comments — `/api/comments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/comments` | ✅ | Add a comment to a post |
| `DELETE` | `/api/comments/:id` | ✅ Owner | Delete a comment |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | `blog_platform_super_secret_jwt_key_2024` | JWT signing secret — **change in production** |

---

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#7c3aed',
  bio TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_color TEXT,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## License

MIT
