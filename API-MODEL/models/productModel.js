const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    prod_id:{
        type:String,
        unique:true
    },
    product_name:{
        type:String,
        required:[true,"please add the product name"]
    },
    producedBy:{
        type:String
    },
    available:{
        type:String,
        required:[true,"please add the product email"]
    },
    description:{
        type:String
    },
    rating:{
        type:String,
        required:[true,"pleae add the phone number"]
    }
},
{
    timestamps:true
})

module.exports = mongoose.model('Product',productSchema);