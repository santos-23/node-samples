const mongoose = require('mongoose')

const connectDB = async() =>{
    mongoose.connect(process.env.MONGO_URL)
    .then(()=>{
        console.log('DB connected')
    })
    .catch((err)=>{
        console.log('connection failed')
    })
}

module.exports = connectDB;