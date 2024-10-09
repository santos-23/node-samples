const mongoose = require('mongoose')

const connectDB = async() =>{
    mongoose.connect("mongodb://localhost:27017/multiArray")
    .then(()=>{
        console.log('DB connected')
    })
    .catch((err)=>{
        console.log('connection failed')
    })
}

module.exports = connectDB;