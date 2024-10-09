// const express = require('express');
// const multer = require('multer');
// const bodyParser = require('body-parser');
// const app = express();
// const port = 3000;

// // Set up multer for handling image uploads
// const storage = multer.diskStorage({
//   destination: 'uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage });

// // In-memory data storage (replace this with a database in a real application)
// let imageData = [];

// // Middleware for parsing application/json and form data
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Serve the static HTML page
// app.use(express.static('public'));

// app.post('/api/upload', upload.single('image'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file provided' });
//   }

//   const imageInfo = {
//     id: Date.now(), // Replace with a unique ID generator in a real application
//     name: req.file.originalname,
//     imageUrl: '/uploads/' + req.file.filename,
//   };

//   imageData.push(imageInfo);

//   res.status(201).json({ message: 'Image uploaded successfully' });
// });

// app.get('/api/images', (req, res) => {
//   res.json(imageData);
// });

// app.listen(port, () => {
//   console.log(`Server listening on http://localhost:${port}`);
// });


const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// Connect to MongoDB (replace 'your_mongodb_uri' with your actual MongoDB URI)
mongoose.connect("mongodb://localhost:27017/demoImage", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Create a schema for the image data
const imageSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageName: String,
  uploadedAt: Date
});

// Create a model for the image data
const Image = mongoose.model('Image', imageSchema);

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('views'));

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/views/demo.html')
})

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const imageInfo = {
    name: req.body.name,
    description: req.body.description,
    imageName:req.file.filename,
    uploadedAt: new Date()
  };

  // Save image data to the database
  Image.create(imageInfo)
    .then(image => {
      console.log('Image data saved to the database:', image);
      res.status(201).json({ message: 'Image uploaded successfully' });
    })
    .catch(error => {
      console.error('Error saving image data:', error);
      res.status(500).json({ message: 'Error uploading image' });
    });
});

app.get('/api/images', (req, res) => {
  // Fetch all image data from the database and return as JSON
  Image.find({}, '-_id -__v') // Exclude '_id' and '__v' fields from the response
    .then(images => res.json(images))
    .catch(error => {
      console.error('Error fetching image data:', error);
      res.status(500).json({ message: 'Error fetching image data' });
    });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
