const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    street: String,
    city:String
})

const userschema = new mongoose.Schema({
    name:String,
    age:{
        type:Number,
        min:1,
        max:100
    },
    email:{
        type:String,
        minlength:10,
        required :true,
        lowercase:true
    },
    createdAt:{
        type:Date,
        immutable:true,
        default : ()=> Date.now()
    },
    updatedAt:{
        type:Date,
        default : ()=> Date.now()
    },
    // bestfriend :mongoose.SchemaTypes.ObjectId,
    hobbies : [String],
    address : addressSchema
})

// userschema.methods.sayHi = function(){
//     console.log(`hi...my name is `+this.name)
// }

// userschema.virtual("namedEmail").get(function(){
//     return console.log(this.name+"<"+this.email+">")
// })

// userschema.pre("save",function(doc,next){
//     this.updatedAt = Date.now();
//     // next();
// })

const user = mongoose.model('user',userschema)
module.exports = user;