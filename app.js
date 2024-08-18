const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5555;

// MongoDB Connection
const DB_URL = process.env.DB_URL;
mongoose.connect(DB_URL)
  .then(() => console.log("DATABASE CONNECTION ESTABLISHED"))
  .catch((error) => console.error("DATABASE CONNECTION FAILED: " + error));

// Ensure uploads directory exists (though we don't need it anymore, keeping for potential future use)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB Schema and Model for Notes
const noteSchema = new mongoose.Schema({
  title: String,
  subject: String, 
  pdfUrl: String // Changed from pdfPath to pdfUrl
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

// Endpoint for testing server
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Endpoint to handle PDF URL submission
app.post('/upload', async (req, res) => {
  const { title, subject, pdfUrl } = req.body; // Expect a URL instead of a file

  try {
    const newNote = new Note({
      title,
      subject, 
      pdfUrl // Save the URL instead of a file path
    });
    await newNote.save();
    res.send('Note uploaded successfully!');
  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).send('Error uploading note: ' + error);
  }
});

// Endpoint to get all notes
app.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find({}).sort({ createdAt: -1 }); // Sort by createdAt in descending order
    console.log('Notes retrieved:', notes);
    res.json(notes);
  } catch (error) {
    console.error('Error retrieving notes:', error);
    res.status(500).send('Error retrieving notes: ' + error);
  }
});

// Endpoint to delete a note
app.delete('/notes/:id', async (req, res) => {
  const noteId = req.params.id;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).send('Note not found');
    }

    await Note.findByIdAndDelete(noteId);
    res.send('Note deleted successfully');
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).send('Error deleting note: ' + error);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
