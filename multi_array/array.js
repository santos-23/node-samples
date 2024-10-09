const express = require("express");
const mongoose = require('mongoose');
const app = express();

mongoose.connect("mongodb://localhost:27017/array")

// const arraySchema = new mongoose.Schema({
//     arrName:String,
//     multi:[
//         [
//             {
//                 name:String,
//                 age:Number
//             }
//         ]
//     ]
// });

// const Array = mongoose.model("Array",arraySchema);

// const arr1 = new Array({
//     arrName:"two",
//     multi:[
//         [
//             {
//                 name:"santos",
//                 age:21
//             }
//         ],
//         [
//             {
//                 name:"vasanth",
//                 age:22
//             }
//         ],
//         [
//             {
//                 name:"siva",
//                 age:23
//             }
//         ]
//     ]
// })
// arr1.save();

const matrix = [
    [1,2,3],
    [4,5,6],
    [7,8,9]
];
console.log(matrix[0][0])


// Array.findOne({arrName:"two"})
// .then((result)=>{
//     if(!result){
//         console.log("not found")
//     }else{
//         console.log(result.multi[0])
//     }
// })
// .catch((err)=>{
//     console.log(err)
// })


app.listen(3000);