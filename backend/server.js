require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/api/laws', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM laws ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    
    try {
        const searchQuery = `
            SELECT * FROM laws 
            WHERE title ILIKE $1 
               OR country ILIKE $1 
               OR summary ILIKE $1
            ORDER BY id
        `;
        const result = await pool.query(searchQuery, [`%${query}%`]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT} и готов к работе с PostgreSQL`);
});
