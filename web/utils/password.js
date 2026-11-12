// Password hashing with scrypt (built into Node, no extra package).
// We save "salt:hash" in customer.password_hash, never the real password.
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function checkPassword(password, saved) {
  const [salt, hash] = String(saved || '').split(':');
  if (!salt || !hash) return false;

  const savedBuf = Buffer.from(hash, 'hex');
  const testBuf = crypto.scryptSync(password, salt, 64);
  // timingSafeEqual so the time taken does not leak how many characters matched
  return savedBuf.length === testBuf.length && crypto.timingSafeEqual(savedBuf, testBuf);
}

module.exports = { hashPassword, checkPassword };
