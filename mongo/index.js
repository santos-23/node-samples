const express = require('express');
const app = express();
const uuid = require('uuid')
const mongoose = require('mongoose');
// const morgon= require('morgon')

// app.use((req,res,next)=>{
//     console.log("i am middleware")
//     next();
// })

//get
// app.get('/',(req,res)=>{
//     res.json("hello....")
// })
// app.get('/about',(req,res)=>{
//     res.json("hello....about")
// })

app.listen(8080,()=>{
    console.log("server started on 3000")
})

const myperson=[
      {id:uuid.v4(),Name:'aaaa',age:22},{id:uuid.v4(),Name:'bbb',age:23},{id:uuid.v4(),Name:'ccc',age:25}
    ]

const personRouter = require('./router')
app.use('/persons',personRouter);



mongoose.connect("mongodb://localhost:27017/demo")
.then(()=>{
    console.log("connected")
})
.catch((err)=>{
    console.log(err)
})