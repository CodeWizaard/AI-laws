require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

const lawsData = [
    { country: "Евросоюз", title: "AI Act (Закон об ИИ)", summary: "Комплексный закон, классифицирующий ИИ-системы по уровню риска.", full_text: "Полный текст закона об ИИ в Евросоюзе..." },
    { country: "Китай", title: "Меры по управлению генеративными ИИ", summary: "Требования к контенту, генерируемому ИИ.", full_text: "Полный текст мер по управлению генеративными ИИ в Китае..." },
    { country: "США", title: "Указ о безопасном и надежном ИИ", summary: "Исполнительный указ президента о стандартах безопасности.", full_text: "Полный текст указа о безопасном и надежном ИИ в США..." }
];

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS laws (
                id SERIAL PRIMARY KEY,
                country VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                full_text TEXT
            );
        `);
        console.log('Таблица "laws" успешно создана или уже существует.');

        await client.query('TRUNCATE TABLE laws RESTART IDENTITY;');

        for (const law of lawsData) {
            await client.query(
                'INSERT INTO laws (country, title, summary, full_text) VALUES ($1, $2, $3, $4)',
                [law.country, law.title, law.summary, law.full_text]
            );
        }
        console.log('Данные успешно добавлены в таблицу.');
    } finally {
        client.release();
        pool.end();
    }
}

initializeDatabase().catch(err => console.error('Ошибка инициализации БД:', err));
