const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = 3000;



const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

const corsOptions = {
  // Указываем источник фронтенда, который запустил Live Server
  origin: 'http://127.0.0.1:5500', 
  // Явно разрешаем методы, включая DELETE
  methods: "GET, POST, PUT, DELETE",
  // Можно добавить и другие нужные опции
  allowedHeaders: "Content-Type, Authorization" 
};

app.use(cors(corsOptions)); // Применяем настройки



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

// --- Создание нового закона ---
app.post('/api/laws', express.json(), async (req, res) => {
  const { country, title, summary, full_text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO laws (country, title, summary, full_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [country, title, summary, full_text]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении закона:', err);
    res.status(500).send('Ошибка сервера');
  }
});

// --- Удаление закона ---
app.delete('/api/laws/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM laws WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при удалении закона:', err);
    res.status(500).send('Ошибка сервера');
  }
});

// --- Редактирование закона ---
app.put('/api/laws/:id', express.json(), async (req, res) => {
  const id = req.params.id;
  const { country, title, summary, full_text } = req.body;
  try {
    const result = await pool.query(
      'UPDATE laws SET country = $1, title = $2, summary = $3, full_text = $4 WHERE id = $5 RETURNING *',
      [country, title, summary, full_text, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при редактировании закона:', err);
    res.status(500).send('Ошибка сервера');
  }
});

