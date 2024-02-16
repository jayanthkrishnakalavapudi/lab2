// Importing required modules
const express = require('express'); 
const path = require('path'); 
const fs = require('fs'); // File system module for Node.js
const { body, validationResult } = require('express-validator'); // Module for validating request data


const app = express();
// Generate a random port number between 8000 and 9000
const PORT = Math.floor(Math.random() * (9000 - 8000 + 1)) + 8000;

// Custom middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.path}`); 
  next();
});

app.use(express.urlencoded({ extended: true })); // Middleware for parsing URL-encoded request bodies
app.use(express.json()); // Middleware for parsing JSON request bodies

// Load contacts data from JSON file
let contacts = require('./contacts.json');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html')); // Send HTML file as response
});

app.get('/contacts', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html')); // Send HTML file as response
});


app.get('/contactsData', (req, res) => {
  res.json(contacts); // Send contacts data as JSON response
});

app.get('/create-contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'create.html')); // Send HTML file as response
});

// Route for viewing a specific contact
app.get('/contacts/:id', (req, res) => {
  const contactId = req.params.id;
  const contact = contacts.find(contact => contact.id === contactId);
  if (!contact) {
    return res.status(400).send('No such contact found!');
  }
  res.sendFile(path.join(__dirname, 'views', 'view.html')); // Send HTML file as response
});

// Route for adding a new contact
app.post('/add-contact', [
  body('email').isEmail(), // Validate check for email format
  body('firstName').notEmpty(), // Validate check for non-empty first name
  body('lastName').notEmpty(), // Validate check for non-empty last name
  body('notes').isLength({ max: 100 }) // Validate check for notes length
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Extract data from request body
  const { firstName, lastName, email, notes } = req.body;
  const newContact = {
    id: Date.now().toString(), // Generate unique ID for new contact
    firstName,
    lastName,
    email,
    notes,

  };
  contacts.push(newContact); // Add new contact to contacts array
  saveContactsToFile(); // Save contacts data to JSON file
  res.redirect('/contacts'); // Redirect to contacts page after successful addition
});

// Route for edit contact page
app.get('/edit-contact/:id', (req, res) => {
  const contactId = req.params.id;
  const contact = contacts.find(contact => contact.id === contactId);
  if (!contact) {
    return res.status(400).send('Contact not found!');
  }
  res.sendFile(path.join(__dirname, 'views', 'edit.html')); 
});

// Route for editing an existing contact
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

  // Extract data from request body
  const contactId = req.params.id;
  const { firstName, lastName, email, notes } = req.body;
  const index = contacts.findIndex(contact => contact.id === contactId);
  if (index === -1) {
    return res.status(400).send('Contact not found!');
  }
  // Update existing contact details
  contacts[index] = {
    ...contacts[index],
    firstName,
    lastName,
    email,
    notes,
    updatedAt: new Date().toLocaleString() // Updat timestamp for last update
  };
  saveContactsToFile(); 
  res.redirect('/contacts'); // Redirect to contacts page after successful edit
});

// Route for deleting a contact
app.delete('/contacts/:id', (req, res) => {
  const contactId = req.params.id;
  const index = contacts.findIndex(contact => contact.id === contactId);
  if (index === -1) {
    return res.status(400).send('Contact not found!');
  }
  contacts.splice(index, 1); // Remove contact from contacts array
  saveContactsToFile(); 
  res.sendStatus(200); // Send success response
});

// save contacts data to JSON file
function saveContactsToFile() {
  const contactsFilePath = path.join(__dirname, 'contacts.json');
  fs.writeFileSync(contactsFilePath, JSON.stringify(contacts, null, 2)); // Write contacts data to file
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!'); // Send error response
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`); 
});
