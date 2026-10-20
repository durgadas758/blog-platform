const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.db');

let _db = null;

function saveDb() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

const db = {
  prepare(sql) {
    return {
      run(...args) {
        const params = flattenParams(args);
        _db.run(sql, params);
        const changes = _db.getRowsModified();
        const ridStmt = _db.prepare('SELECT last_insert_rowid() AS rid');
        ridStmt.step();
        const lastInsertRowid = ridStmt.getAsObject().rid;
        ridStmt.free();
        saveDb();
        return { lastInsertRowid, changes };
      },

      get(...args) {
        const params = flattenParams(args);
        const stmt = _db.prepare(sql);
        try {
          stmt.bind(params);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      all(...args) {
        const params = flattenParams(args);
        const stmt = _db.prepare(sql);
        const rows = [];
        try {
          stmt.bind(params);
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
        } finally {
          stmt.free();
        }
        return rows;
      },
    };
  },

  exec(sql) {
    _db.exec(sql);
    saveDb();
  },

  pragma(pragmaStr) {
    try { _db.run(`PRAGMA ${pragmaStr}`); } catch { }
  },
};

function flattenParams(args) {
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return args;
}

async function initDb() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#7c3aed',
      bio TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      cover_color TEXT DEFAULT 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized:', DB_PATH);
  return db;
}

db.initDb = initDb;
module.exports = db;
