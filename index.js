require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database.");
});

app.get("/movies", (req, res) => {
    const sql = `
      SELECT m.*, p.name AS producer_name,
      CONCAT('[', GROUP_CONCAT(
        CONCAT('{ "actor_id": ', a.id, ', "actor_name": "', a.name, '" }')
        ORDER BY a.name SEPARATOR ', '), ']') AS actors
      FROM movies m
      JOIN producers p ON m.producer_id = p.id
      JOIN movies_actors ma ON m.id = ma.movie_id
      JOIN actors a ON ma.actor_id = a.id
      GROUP BY m.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.map(movie => ({ ...movie, actors: JSON.parse(movie.actors) })));
    });
});

app.get("/movies/:id", (req, res) => {
  const sql = "SELECT * FROM movies WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
  });
});

app.post("/movies", (req, res) => {
  const { title, release_date, plot, poster } = req.body;
  const sql = "INSERT INTO movies (title, release_date, plot, poster) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, release_date, plot, poster], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Movie added", id: result.insertId });
  });
});

app.put("/movies/:id", (req, res) => {
  const { title, release_date, plot, poster } = req.body;
  const sql = "UPDATE movies SET title = ?, release_date = ?, plot = ?, poster = ? WHERE id = ?";
  db.query(sql, [title, release_date, plot, poster, req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Movie updated" });
  });
});

app.delete("/movies/:id", (req, res) => {
  const sql = "DELETE FROM movies WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Movie deleted" });
  });
});

app.get("/actors", (req, res) => {
    const sql = "SELECT * FROM actors";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get("/actors/:id", (req, res) => {
  const sql = "SELECT * FROM actors WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
  });
});

app.post("/actors", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;
  const sql = "INSERT INTO actors (name, gender, dateOfBirth, bio) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, gender, dateOfBirth, bio], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Actor added", id: result.insertId });
  });
});

app.put("/actors/:id", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;
  const sql = "UPDATE movies SET name = ?, gender = ?, dateOfBirth = ?, bio = ? WHERE id = ?";
  db.query(sql, [name, gender, dateOfBirth, bio, req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Actor updated" });
  });
});

app.delete("/actors/:id", (req, res) => {
  const sql = "DELETE FROM actors WHERE id = ?; DELETE FROM movies_actors WHERE actor_id = ?";
  db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Actor deleted" });
  });
});

app.get("/producers", (req, res) => {
    const sql = "SELECT * FROM producers";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get("/producers/:id", (req, res) => {
  const sql = "SELECT * FROM producers WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
  });
});

app.post("/producers", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;
  const sql = "INSERT INTO producers (name, gender, dateOfBirth, bio) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, gender, dateOfBirth, bio], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producer added", id: result.insertId });
  });
});

app.put("/producers/:id", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;
  const sql = "UPDATE producers SET name = ?, gender = ?, dateOfBirth = ?, bio = ? WHERE id = ?";
  db.query(sql, [name, gender, dateOfBirth, bio, req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producer updated" });
  });
});

app.delete("/producers/:id", (req, res) => {
  const sql = "DELETE FROM producers WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producer deleted" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));