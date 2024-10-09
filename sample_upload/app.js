// app.js
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/samupload', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define the data schema and model
const dataSchema = new mongoose.Schema({
    name: String,
    age: Number,
    city: String,
    fileName: String,
    filePath: String,
});

const Data = mongoose.model('Data', dataSchema);

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Use EJS as the template engine
app.set('view engine', 'ejs');

// Parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Serve static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/',(req,res)=>{
    res.render('index')
})
// Route to handle the POST request and save data to the database
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // Retrieve data from the request body and file from multer middleware
        const { name, age, city } = req.body;
        const file = req.file;

        // Create a new Data object with the received data
        const newData = new Data({
            name: name,
            age: age,
            city: city,
            fileName: file ? file.filename : null,
            filePath: file ? file.path : null,
        });

      // Save the data to the database
        await newData.save();

      // Respond with the file details so that they can be displayed in the DataTable
        res.json({ fileName: newData.fileName, filePath: newData.filePath });
    } catch (error) {
        res.status(500).json({ error: 'Error saving data' });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
