import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
    const { id } = req.query;

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    if (req.method === "GET") {
        const [rows] = await db.query("SELECT * FROM movies WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.status(200).json(rows[0]);
    } else if (req.method === "PUT") {
        const { title, release_year, plot, poster } = req.body;
        await db.query("UPDATE movies SET name = ?, email = ? WHERE id = ?", [title, release_year, plot, poster, id]);
        res.status(200).json({ message: "Movie updated" });
    } else if (req.method === "DELETE") {
        await db.query("DELETE FROM movies WHERE id = ?", [id]);
        res.status(200).json({ message: "Movie deleted" });
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}