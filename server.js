const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');

const corsOptions = {
  origin: '*',
}

const app = express();

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initDatabase = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `;
    await pool.query(createTableQuery);

    const users = [
      { username: 'admin1', password: 'password1',},
      { username: 'admin2', password: 'password2',}
    ];

    for (const user of users) {
      const insertQuery = 'INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING';
      await pool.query(insertQuery, [user.username, user.password]);
    }

  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDatabase();

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required!' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Login successful!' });
    } else {
      res.status(401).json({ message: 'Invalid credentials!' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error!' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});