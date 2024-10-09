const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const path = require('path')

app.use('/admin',adminRoutes);
app.use(shopRoutes);
app.use((req,res,next)=>{
    res.status(404).sendFile(path.join(__dirname,'views','404.html'))
})


app.use(bodyParser.urlencoded())


app.listen(3000)

// app.use('/Third',(req,res,next)=>{
//     res.send('<h1>Third page</h1>');
//     next();
// })
// app.use('/second',(req,res,next)=>{
//     res.send('<h1>second page</h1>');
//     next();
// })
// app.use((req,res,next)=>{
//     res.send('<h1>First page</h1>');
//     next();
// })

