const db = require("better-sqlite3")("fotballigaen.db")


db.exec(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username TEXT,
        hash TEXT
    )
`)
