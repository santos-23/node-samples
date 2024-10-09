const express = require('express');
const mongoose = require('mongoose');
// const { PassThrough } = require('stream');
const app=express();
const uuid = require('uuid')
const schema = mongoose.Schema

app.listen(3000,()=>{
  console.log("server started on port 3000")
})

// const myperson=[
//   {id:uuid.v4(),Name:'aaaa',age:22},{id:uuid.v4(),Name:'bbb',age:23},{id:uuid.v4(),Name:'ccc',age:25}
// ]
// app.get('/',(req,res)=>{
//       res.json(myperson)
//   })
// app.get('/:id',async(req,res)=>{
//   const getone = await myperson.filter(e => e.id === req.params.id)
//   res.status(200).json(getone)
// })

mongoose.connect("mongodb://localhost:27017/myDB12",{useUnifiedTopology:true,useNewUrlParser:true})
.then(() =>{
  console.log("connected")
})
.catch((err) => {
  console.log(err)
})

const userSchema = new mongoose.Schema({
  name:String,age:Number,city:String
})

const user = mongoose.model('user',userSchema,'userDetails')
// const newuser = new user({name:"sanju",age:23,city:"madurai"})

user.findOne()
.then((err,docs)=>{
  if(err) throw err;
  else{console.log(docs)}
}).catch((err)=>{
  console.log(err)
})


// const bookschema = new schema(
//   {name:String,price:Number,quantity:Number}
// )
// const book = mongoose.model('book',bookschema,'bookstore');
// let book1 = new book(
//   {name:'book1',price:1000,quantity:5},
//   {name:'book2',price:300,quantity:10},
//   {name:'book3',price:500,quantity:7}
// );

// book.collection.insert(book1,(err,docs)=>{
//   if(err){ return console.error(err) }
//   else{
//     console.log("multiple documents are inserted")
//   }
// })

// book.save()
// .then((book)=>{
//   console.log(book.name+" is saved to collection")
// })
// .catch((err)=>{
//   console.log(err)
// })

// book.createCollection().then((collection)=>{
//   console.log("collection is created")
// })


