const mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/loginSignup")
.then(()=>{
    console.log("mongoose connected")
})
.catch((err)=>{
    console.log("failed to connect")
})

const loginSchema = new mongoose.Schema({
    name : String,
    email:{
        type:String,
        required:true
    },
    number:Number,
    password:{
        type:String,
        required:true
    }
})

const loginCollection = mongoose.model('loginCollection',loginSchema,'userDetails');

module.exports = loginCollection;