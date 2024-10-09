const express = require('express');
const app = express();
const mongoose = require('mongoose')
const User = require('./monogDB')

mongoose.connect("mongodb://localhost:27017/pagination");
const db = mongoose.connection;
db.once('open',async()=>{
    if(await User.countDocuments().exec() > 0) return

    Promise.all([
        User.create({name:"user 1"}),
        User.create({name:"user 2"}),
        User.create({name:"user 3"}),
        User.create({name:"user 4"}),
        User.create({name:"user 5"}),
        User.create({name:"user 6"}),
        User.create({name:"user 7"}),
        User.create({name:"user 8"}),
        User.create({name:"user 9"}),
        User.create({name:"user 10"}),
        User.create({name:"user 11"}),
        User.create({name:"user 12"}),
        User.create({name:"user 13"}),
    ]).then(()=> console.log("added users"))
})

// const user = [
//     {id:101,name:"user 1",},
//     {id:102,name:"user 2"},
//     {id:103,name:"user 3"},
//     {id:104,name:"user 4"},
//     {id:105,name:"user 5"},
//     {id:106,name:"user 6"},
//     {id:107,name:"user 7"},
//     {id:108,name:"user 8"},
// ]

app.get('/users',paginatedResult(User),(req,res)=>{
    res.json(res.paginatedResult)
})



function paginatedResult(model){
    return async(req,res,next)=>{
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    startIndex = (page-1)*limit;
    endIndex = page*limit;
    
    const results={}

    if(endIndex < await model.countDocuments().exec()){
        results.next ={
            page : page+1,
            limit: limit
        }
    }
    if(startIndex > 0){
        results.previous ={
            page : page-1,
            limit: limit
        }
    }
    
    try{
        results.results = await model.find().limit(limit).skip(startIndex).exec()
        res.paginatedResult = results;
        next();
    }catch(e){
        res.status(500).json({message:e.message})
    }
    }
}

app.listen(3000);