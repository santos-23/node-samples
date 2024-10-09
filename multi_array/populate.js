const express = require('express')
const mongoose = require('mongoose');
const {Student,Address} = require('./route')
const app = express()

mongoose.connect("mongodb://localhost:27017/populate")
.then(()=>{
    console.log('DB connected')
})
.catch((err)=>{
    console.log('connection failed: ',err)
})

app.use(express.json())

app.post('/student',async(req,res)=>{
    try{
        const {name,age,email} = req.body;
        let newstu = new Student({
            name,age,email
        })
        newstu.save()
        .then((result)=>{
            console.log(result)
            res.json(result)
        }).catch((err)=>{
            res.send(err)
        })
    }catch(err){
        res.status(404).json(err)
    }
})

// let adr = new Address({
//     flatNo:14,
//     street:"ksr street",
//     city:"madurai"
// })

// adr.save()

// Student.findOne({name:"santos"})
// .then((result)=>{
//     console.log(result)
// })
// .catch((err)=>{
//     console.log(err)
// })

// .then((record)=>{
//     let student = new Student({
//         name:"santos",
//         age:21,
//         email:"santos@gmail.com",
//         address:record._id
//     })
//     student.save()
//     .then((stu)=>{
//         console.log(stu)
//     })
//     .catch((err)=>{
//         console.log(err)
//     })
// })
// .catch((err)=>{
//     console.log(err)
// })

// Student.findOne({_id:"64bba9b4c9be14787a342153"})
// .populate({
//     path:"address"
    
// })
// .exec()
// .then((data)=>{
//     console.log(data)
// })
// .catch((err)=>{
//     console.log(err)
// })

app.listen(3000)