require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 2 }
}));

app.use('/api', authRoutes);
app.use('/api', shopRoutes);
app.use('/api/staff', staffRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// do not send SQL errors to the browser, only log them here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bookstore running at http://localhost:${port}`);
});
