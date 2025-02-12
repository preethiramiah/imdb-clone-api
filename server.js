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

app.post("/movies", (req, res) => {
    const { name, email } = req.body;
    const sql = "INSERT INTO movies (title, release_date, plot, poster) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "User created", id: result.insertId });
    });
});

app.get("/movies", (req, res) => {
    const sql = "SELECT * FROM movies";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get("/movies/:id", (req, res) => {
    const sql = "SELECT * FROM movies WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

app.put("/movies/:id", (req, res) => {
    const { name, email } = req.body;
    const sql = "UPDATE movies SET title = ?, release_date = ?, plot = ?, poster = ? WHERE id = ?";
    db.query(sql, [name, email, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "User updated" });
    });
});

app.delete("/movies/:id", (req, res) => {
    const sql = "DELETE FROM movies WHERE id = ?";
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "User deleted" });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
