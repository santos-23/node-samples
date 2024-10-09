const mongoose = require('mongoose');
const express = require('express');
const app = express()
const swaggerUI = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerJsDocs = YAML.load('./api.yaml')
const fileUpload = require('express-fileupload')
const aggre = require('./agg');
const axios = require('axios')
const cors = require('cors')
app.use(express.json())
app.use(fileUpload())

mongoose.connect("mongodb://localhost:27017/aggregation")
.then(()=>{
    console.log('DB connected')
})
.catch((err)=>{
    console.log(err)
})

app.use(cors());

// aggre.aggregation();
let users = [
    {id:1, name:"santos"},
    {id:2, name:"vasanth"},
    {id:3, name:"siva"},
]

app.get('/users',(req,res)=>{
    res.status(200).send(users)
})

app.post('/upload',(req,res)=>{
    const file = req.files.file;
    // console.log(req.headers)
    // console.log(req.cookies)
    let path = __dirname+"/upload/"+"file"+Date.now()+".jpg";
    file.mv(path,(err)=>{
        res.status(200).send("ok")
    })
})

app.get('/users/:id',(req,res)=>{
    const obj = users.find((x)=> x.id === parseInt(req.params.id))
    res.status(200).send(obj)
})

// app.delete('/users/:id',(req,res)=>{
//     users.
// })

app.get('/userqueries',(req,res)=>{
    const obj = users.find((x)=> x.id === parseInt(req.query.id))
    res.status(200).send(obj)
})

app.post('/create',(req,res)=>{
    users = [req.body, ...users]
    res.status(200).send(users)
})

app.use('/api',require('./route'))
app.use('/api-docs',swaggerUI.serve,swaggerUI.setup(swaggerJsDocs));

app.listen(3000);