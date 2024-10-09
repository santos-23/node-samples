const express = require('express');
const app = express();
const cors = require('cors')
const mongoose = require('mongoose')

app.use(express.json());
app.use(cors());

// mongoose.connect("mongodb://localhost:27017/axios")
// .then(()=>{
//     console.log('DB connected')
// })
// .catch((err)=>{
//     console.log('connection failed')
// })

app.get('/api/data', (req, res) => {
    const data = { message: 'Hello from the server!' };
    res.json(data);
});

app.post('/api/data',(req,res)=>{
    const data = req.body;
    console.log("Received: "+data)
    res.status(200).json({Message:"Data received successfully"})
})

const port=3000;
app.listen(port,()=>{
    console.log(`server listening the port ${port}`)
})