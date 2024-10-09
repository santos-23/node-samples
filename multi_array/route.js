const mongoose = require('mongoose');

const studentAddress = new mongoose.Schema({
    stud_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student"
    },
    flatNo:Number,
    street:String,
    city:String
})

const studentSchema = new mongoose.Schema({
    name:String,
    age:Number,
    email:String,
    address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Address"
    }
})

const Student = mongoose.model("Student",studentSchema)
const Address = mongoose.model("Address",studentAddress)

module.exports = {Student,Address}