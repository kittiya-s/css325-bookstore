const crypto = require('crypto');
const customerModel = require('../models/customerModel');
const { hashPassword, checkPassword } = require('../utils/password');

// who is logged in (used by every page to build the menu)
function me(req, res) {
  res.json({
    customer: req.session.customer || null,
    isStaff: !!req.session.isStaff
  });
}

async function register(req, res) {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !email || password.length < 6) {
    return res.status(400).json({ error: 'Please fill in all fields (password at least 6 characters).' });
  }

  let customerId;
  try {
    customerId = await customerModel.createCustomer(name, email, hashPassword(password));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This email is already used.' });
    }
    throw err;
  }

  // new session id after login (prevents session fixation)
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Please log in again.' });
    req.session.customer = { id: customerId, name };
    res.json({ message: 'Account created.' });
  });
}

async function login(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const customer = await customerModel.findByEmail(email);

  // same message for wrong email and wrong password
  if (!customer || !checkPassword(password, customer.password_hash)) {
    return res.status(400).json({ error: 'Email or password is incorrect.' });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Please try again.' });
    req.session.customer = { id: customer.customer_id, name: customer.name };
    res.json({ message: 'Logged in.' });
  });
}

function sameText(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function staffLogin(req, res) {
  const { username, password } = req.body;
  const configured = process.env.STAFF_USERNAME && process.env.STAFF_PASSWORD;

  if (!configured || !sameText(username, process.env.STAFF_USERNAME) ||
      !sameText(password, process.env.STAFF_PASSWORD)) {
    return res.status(400).json({ error: 'Wrong username or password.' });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Please try again.' });
    req.session.isStaff = true;
    res.json({ message: 'Logged in.' });
  });
}

function logout(req, res) {
  req.session.destroy(() => res.json({ message: 'Logged out.' }));
}

module.exports = { me, register, login, staffLogin, logout };
