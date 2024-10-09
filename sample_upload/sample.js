// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer'); // Required for handling file uploads

const app = express();
const PORT = 3000;

// Connect to MongoDB (replace 'your-mongodb-uri' with your actual MongoDB URI)
mongoose.connect("mongodb://localhost:27017/sample1", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define the schema for your MongoDB collection
const dataSchema = new mongoose.Schema({
  name: String,
  image_url: String
});

// Define the model based on the schema
const DataModel = mongoose.model('Data', dataSchema);

// Middleware to parse incoming JSON data
app.use(bodyParser.json());

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/sample.html')
})

// API endpoint to upload file and save data to MongoDB via POST request
app.post('/api/upload', upload.single('image'), (req, res) => {
  const { name } = req.body;
  const image_url = req.file ? req.file.path : '';

  // Create a new document based on the DataModel
  const newData = new DataModel({
    name: name,
    image_url: image_url
  });

  // Save the new data to the database
  newData.save()
  .then(()=>{
    res.json({ message: 'Data saved successfully.' });
  })
  .catch((err)=>{
    console.error('Error saving data to MongoDB:', err);
    return res.status(500).json({ error: 'Failed to save data to MongoDB.' });
  })
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });

