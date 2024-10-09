const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    stuname:String,
    age:Number,
    city:String,
    standard:Number,
    mark1:Number,
    mark2:Number,
    mark3:Number
});

const orderSchmea = new mongoose.Schema({
    _id:Number,
    item:String,
    price:Number,
    quantity:Number
})

const inventorySchema = new mongoose.Schema({
    _id:Number,
    name:String,
    description:String,
    instock:Number
})

const User = mongoose.model("User",userSchema);
const order = mongoose.model("order",orderSchmea);
const inventory = mongoose.model("inventory",inventorySchema)

module.exports = {User,order,inventory};