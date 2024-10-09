const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path')
const app = express();
const port = 8080;

// Connect to MongoDB (replace 'your_mongodb_uri' with your actual MongoDB URI)
mongoose.connect("mongodb://localhost:27017/empInfo", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Create a schema for the image data
const imageSchema = new mongoose.Schema({
  name: String,
  id:Number,
  age:Number,
  position:String,
  phone:Number,
  address:String,
  skills:String,
  qualification:String,
  imageUrl: String,
  uploadedAt: Date
});

// Create a model for the image data
const Image = mongoose.model('Image', imageSchema);

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
    // cb(null,"empID-"+req.body.id)
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('views'));

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/views/empImage.html')
})

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }
//   const url = 'http://localhost:3000//multi_array/uploads/'+req.file.filename;  'http://localhost:3000/multi_array/uploads/' + 
  const imageInfo = {
    name: req.body.name,
    id:req.body.id,
    age:req.body.age,
    position:req.body.position,
    phone:req.body.phone,
    address:req.body.address,
    skills:req.body.skills,
    qualification:req.body.qualification,
    imageUrl: `http://localhost:3000/uploads/${req.file.filename}`,
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
