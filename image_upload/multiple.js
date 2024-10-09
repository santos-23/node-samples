const express = require('express');
const multer = require('multer');
const path = require('path')
const app = express();
const sharp = require('sharp')

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs')

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'public/upload')
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname+'-'+Date.now()+path.extname(file.originalname))
    }
})

var upload = multer({
    storage:storage
})

const mulitpleFile = upload.fields([{name:"file1"},{name:"file2" ,maxCount:5}])

app.post('/upload',mulitpleFile,(req,res)=>{
    if(req.files){
        console.log(req.files)
        console.log("Files uploaded")
        res.json("files uploaded successfully")
    }
})

app.get('/',(req,res)=>{
    res.render('multiFile')
})

app.listen(3000,()=>{
    console.log('server listen on port 3000')
});