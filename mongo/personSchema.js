const mongoose = require('mongoose')

const personSchema = mongoose.Schema({
    Name:{
        type:String,
        required:true
    },
    Age:{
        type:String,
        required:true
    },
    createdTime:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('Persons',personSchema);