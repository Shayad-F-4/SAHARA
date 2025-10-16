import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import users from './routes/users.js';
import help from './routes/help.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, name: 'Sahara JSON API' }));
app.use('/api/users', users);
app.use('/api/help', help);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Sahara JSON API listening on port ${PORT}`));
