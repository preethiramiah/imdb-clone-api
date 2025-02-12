import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    if (req.method === "GET") {
        const [rows] = await db.query("SELECT * FROM movies");
        res.status(200).json(rows);
    } else if (req.method === "POST") {
        const { title, release_year, plot, poster } = req.body;
        const [result] = await db.query("INSERT INTO movies (title, release_year, plot, poster) VALUES (?, ?, ?, ?)", [title, release_year, plot, poster]);
        res.status(201).json({ id: result.insertId, title, release_year, plot, poster });
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}