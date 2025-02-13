require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const { isValidDate, isValidURL } = require("./utils");

const app = express();
app.use(cors());
app.use(express.json());
app.options('*', cors());

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
      LEFT JOIN producers p ON m.producer_id = p.id
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
  const sql = `
    SELECT m.*, p.name AS producer_name,
    CONCAT('[', GROUP_CONCAT(
      CONCAT('{ "actor_id": ', a.id, ', "actor_name": "', a.name, '" }')
      ORDER BY a.name SEPARATOR ', '), ']') AS actors
    FROM movies m
    JOIN producers p ON m.producer_id = p.id
    JOIN movies_actors ma ON m.id = ma.movie_id
    JOIN actors a ON ma.actor_id = a.id
    WHERE m.id = ?
    GROUP BY m.id
  `;
  db.query(sql, [req.params.id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ ...result[0], actors: JSON.parse(result[0].actors) });
  });
});

app.post("/add-movie", (req, res) => {
  const { title, release_year, plot, poster, actors, producer_id } = req.body;

  if (!title) return res.status(404).json({ message: 'title cannot be empty' });

  const sql = "INSERT INTO movies (title, release_year, plot, poster, producer_id) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [title, release_year, plot, poster, producer_id], (err, result) => {
      if (err) return res.status(500).json(err);
      actors.forEach(id => {
        db.query("INSERT IGNORE INTO movies_actors (movie_id, actor_id) VALUES (?, ?)", [result.insertId, id], (err) => {
            if (err) return res.status(500).json(err);
        });
      });
      res.json({ message: "Movie added", id: result.insertId });
  });
});

app.put("/update-movie/:id", (req, res) => {
  const { title, release_year, plot, poster, actors, producer_id } = req.body;

  if (!title) return res.status(404).json({ message: 'title cannot be empty' });

  const sql = "UPDATE movies SET title = ?, release_year = ?, plot = ?, poster = ?, producer_id = ? WHERE id = ?";
  db.query(sql, [title, release_year, plot, poster, producer_id, req.params.id], (err) => {
      if (err) return res.status(500).json(err);

      db.query('SELECT * FROM movies_actors WHERE movie_id = ?', [req.params.id], (err, results) => {
          if (err) return res.status(500).json(err);
          if (!results?.length || !actors?.length) return;

          const actorsToDelete = results.map(({ actor_id }) => actor_id).filter(id => !actors.includes(id));
          actorsToDelete.forEach(id => {
            db.query('DELETE FROM movies_actors WHERE actor_id = ?', [id], (err) => {
                if (err) return res.status(500).json(err);
            });
          });

          actors.forEach(id => {
            db.query("INSERT IGNORE INTO movies_actors (movie_id, actor_id) VALUES (?, ?)", [req.params.id, id], (err) => {
                if (err) return res.status(500).json(err);
            });
          });
      });
      
      res.json({ message: "Movie updated" });
  });
});

app.delete("/delete-movie/:id", (req, res) => {
  db.query("DELETE FROM movies WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json(err);

      db.query("DELETE FROM movies_actors WHERE movie_id = ?", [req.params.id], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Movie deleted" });
      });
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

app.post("/add-actor", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;

  if (!name) return res.status(404).json({ message: 'name cannot be empty' });
  if (!isValidDate(dateOfBirth)) return res.status(404).json({ message: 'dateOfBirth is not a valid date' });

  const sql = "INSERT INTO actors (name, gender, dateOfBirth, bio) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, gender, dateOfBirth, bio], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Actor added", id: result.insertId });
  });
});

app.put("/update-actor/:id", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;

  if (!name) return res.status(404).json({ message: 'name cannot be empty' });
  if (!isValidDate(dateOfBirth)) return res.status(404).json({ message: 'dateOfBirth is not a valid date' });

  const sql = "UPDATE actors SET name = ?, gender = ?, dateOfBirth = ?, bio = ? WHERE id = ?";
  db.query(sql, [name, gender, dateOfBirth, bio, req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Actor updated" });
  });
});

app.delete("/delete-actor/:id", (req, res) => {
  const sql = "DELETE FROM actors WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json(err);

      db.query("DELETE FROM movies_actors WHERE actor_id = ?", [req.params.id], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Actor deleted" });
      });
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

app.post("/add-producer", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;

  if (!name) return res.status(404).json({ message: 'name cannot be empty' });
  if (!isValidDate(dateOfBirth)) return res.status(404).json({ message: 'dateOfBirth is not a valid date' });

  const sql = "INSERT INTO producers (name, gender, dateOfBirth, bio) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, gender, dateOfBirth, bio], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producer added", id: result.insertId });
  });
});

app.put("/update-producer/:id", (req, res) => {
  const { name, gender, dateOfBirth, bio } = req.body;

  if (!name) return res.status(404).json({ message: 'name cannot be empty' });
  if (!isValidDate(dateOfBirth)) return res.status(404).json({ message: 'dateOfBirth is not a valid date' });

  const sql = "UPDATE producers SET name = ?, gender = ?, dateOfBirth = ?, bio = ? WHERE id = ?";
  db.query(sql, [name, gender, dateOfBirth, bio, req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producer updated" });
  });
});

app.delete("/delete-producer/:id", (req, res) => {
  const sql = "DELETE FROM producers WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json(err);

      db.query("UPDATE movies SET producer_id = null WHERE id = ?", [req.params.id], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Producer deleted" });
      });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));