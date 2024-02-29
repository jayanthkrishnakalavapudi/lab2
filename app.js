const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = Math.floor(Math.random() * (9000 - 8000 + 1)) + 8000;

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database connection
const db = new sqlite3.Database('./data/contacts.db');

// Database setup
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      notes TEXT,
      updatedAt TEXT
    )
  `);
});

// Route for serving the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route for serving the contact page
app.get('/contacts', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// Route for fetching all contacts data
app.get('/contactsData', (req, res) => {
  db.all("SELECT * FROM contacts", (err, rows) => {
    if (err) {
      return res.status(500).send('Something went wrong!');
    }
    res.json(rows);
  });
});

// Route for serving the create contact page
app.get('/create-contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'create.html'));
});

// Route for viewing a specific contact
app.get('/contacts/:id', (req, res) => {
  const contactId = req.params.id;
  db.get("SELECT * FROM contacts WHERE id = ?", [contactId], (err, row) => {
    if (err || !row) {
      return res.status(400).send('Contact not found!');
    }
    res.json(row); 
  });
});


// Route for adding a new contact
app.post('/add-contact', [
  body('email').isEmail(),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('notes').isLength({ max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, notes } = req.body;
  const updatedAt = new Date().toLocaleString();

  db.run("INSERT INTO contacts (firstName, lastName, email, notes, updatedAt) VALUES (?, ?, ?, ?, ?)", [firstName, lastName, email, notes, updatedAt], function (err) {
    if (err) {
      return res.status(500).send('Something went wrong!');
    }
    res.redirect('/contacts');
  });
});

// Route for serving the edit contact page
app.get('/edit-contact/:id', (req, res) => {
  const contactId = req.params.id;
  db.get("SELECT * FROM contacts WHERE id = ?", [contactId], (err, row) => {
    if (err || !row) {
      return res.status(400).send('Contact not found!');
    }
    res.sendFile(path.join(__dirname, 'views', 'edit.html'));
  });
});

// Route for updating an existing contact
app.post('/edit-contact/:id', [
  body('email').isEmail(),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('notes').isLength({ max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const contactId = req.params.id;
  const { firstName, lastName, email, notes } = req.body;
  const updatedAt = new Date().toLocaleString();

  db.run("UPDATE contacts SET firstName = ?, lastName = ?, email = ?, notes = ?, updatedAt = ? WHERE id = ?", [firstName, lastName, email, notes, updatedAt, contactId], function (err) {
    if (err) {
      return res.status(500).send('Something went wrong!');
    }
    res.redirect('/contacts');
  });
});

// Route for deleting a contact
app.delete('/contacts/:id', (req, res) => {
  const contactId = req.params.id;
  db.run("DELETE FROM contacts WHERE id = ?", [contactId], function (err) {
    if (err) {
      return res.status(500).send('Something went wrong!');
    }
    res.sendStatus(200);
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
