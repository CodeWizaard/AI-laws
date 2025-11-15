const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

const transporter = nodemailer.createTransport({
  service: 'yandex', // или другой SMTP сервис
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});


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

// Определяем асинхронный обработчик для POST-запроса на эндпоинт /api/register
// Этот эндпоинт будет отвечать за регистрацию новых пользователей.
app.post('/api/register', async (req, res) => {
  // Извлекаем email и password из тела (body) входящего HTTP-запроса.
  // Предполагается, что клиент отправляет эти данные в формате JSON.
  const { email, password } = req.body;

  // Используем блок try...catch для обработки потенциальных ошибок,
  // которые могут возникнуть при работе с базой данных или отправке email.
  try {
    // 1. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОЛЬЗОВАТЕЛЯ
    // Выполняем асинхронный SQL-запрос к базе данных, чтобы найти пользователя с указанным email.
    // '$1' — это плейсхолдер для безопасной вставки значения [email].
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Если массив `existing.rows` содержит хотя бы один элемент, значит, пользователь с таким email уже есть.
    if (existing.rows.length > 0) {
      // Возвращаем ответ с HTTP-статусом 400 (Bad Request) и сообщением об ошибке.
      // `return` используется, чтобы немедленно прекратить выполнение функции.
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // 2. ХЕШИРОВАНИЕ ПАРОЛЯ
    // Хешируем полученный пароль с помощью библиотеки bcrypt.
    // 10 — это "стоимость" хеширования (количество раундов), чем выше, тем безопаснее, но медленнее.
    const password_hash = await bcrypt.hash(password, 10);
    
    // 3. ГЕНЕРАЦИЯ КОДА ПОДТВЕРЖДЕНИЯ
    // Генерируем случайное 6-значное число и преобразуем его в строку.
    const verification_code = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. СОЗДАНИЕ НОВОГО ПОЛЬЗОВАТЕЛЯ В БД
    // Выполняем SQL-запрос на добавление нового пользователя в таблицу `users`.
    // Сохраняем email, хешированный пароль, сгенерированный код и устанавливаем флаг `is_verified` в `false`.
    await pool.query(
      'INSERT INTO users (email, password_hash, is_verified, verification_code) VALUES ($1, $2, false, $3)',
      [email, password_hash, verification_code]
    );

    // 5. ОТПРАВКА EMAIL С КОДОМ
    // Используем ранее настроенный `transporter` (объект nodemailer) для отправки письма.
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Email отправителя (из переменных окружения .env)
      to: email,                     // Email получателя (адрес, указанный при регистрации)
      subject: 'Код подтверждения',  // Тема письма
      text: `Ваш код подтверждения: ${verification_code}`, // Тело письма с кодом
    });

    // 6. ОТПРАВКА УСПЕШНОГО ОТВЕТА
    // Если все шаги прошли успешно, отправляем клиенту ответ с сообщением,
    // что нужно проверить почту для завершения регистрации.
    res.json({ message: 'Проверьте почту для подтверждения аккаунта' });

  // Блок `catch` выполнится, если на любом из шагов в `try` произойдет ошибка.
  } catch (error) {
    // Выводим полную информацию об ошибке в консоль сервера для отладки.
    console.error(error);
    // Отправляем клиенту ответ с HTTP-статусом 500 (Internal Server Error) и общим сообщением об ошибке.
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- ПОДТВЕРЖДЕНИЕ EMAIL ПО КОДУ ---
app.post('/api/verify', async (req, res) => {
  // Получаем email и код из тела запроса
  const { email, code } = req.body;

  try {
    // Ищем пользователя по email в базе данных
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Если пользователь не найден, отправляем ошибку
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Пользователь с таким email не найден' });
    }

    const user = userResult.rows[0];

    // Проверяем, не подтвержден ли аккаунт уже
    if (user.is_verified) {
      return res.json({ message: 'Аккаунт уже подтвержден' });
    }
    
    // Сравниваем код из запроса с кодом из базы данных
    if (user.verification_code === code) {
      // Если коды совпали, обновляем статус пользователя на "подтвержден"
      await pool.query('UPDATE users SET is_verified = true, verification_code = NULL WHERE email = $1', [email]);
      res.json({ message: 'Email успешно подтверждён. Теперь вы можете войти.' });
    } else {
      // Если коды не совпали, отправляем ошибку
      res.status(400).json({ message: 'Неверный код подтверждения' });
    }
  } catch (error) {
    console.error('Ошибка при верификации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- ВХОД В СИСТЕМУ И ВЫДАЧА JWT-ТОКЕНА ---
app.post('/api/login', async (req, res) => {
  // Получаем email и пароль из тела запроса
  const { email, password } = req.body;

  try {
    // Ищем пользователя по email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // Если пользователь не найден, отправляем общую ошибку
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const user = userResult.rows[0];

    // Проверяем, подтвердил ли пользователь свою почту
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Ваш email не подтвержден. Проверьте почту.' });
    }

    // Сравниваем введенный пароль с хешем в базе данных
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    // Если пароли не совпадают, отправляем ошибку
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    // Если все проверки пройдены, создаем JWT-токен
    // В токен можно записать полезную информацию, например, ID и email пользователя
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET, // Используем секретный ключ из .env файла
      { expiresIn: '1h' }    // Устанавливаем срок жизни токена (например, 1 час)
    );

    // Отправляем токен клиенту
    res.json({ token });

  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});