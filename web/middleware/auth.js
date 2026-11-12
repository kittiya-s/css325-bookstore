// customer must be logged in
function requireCustomer(req, res, next) {
  if (!req.session.customer) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  next();
}

// staff must be logged in
function requireStaff(req, res, next) {
  if (!req.session.isStaff) {
    return res.status(401).json({ error: 'Staff only.' });
  }
  next();
}

module.exports = { requireCustomer, requireStaff };
