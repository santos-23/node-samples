const express = require('express');
const multer = require('multer');
const app = express();
const path = require('path');
const sharp = require('sharp');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs')


var storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'upload')
    },  // destination : 'upload'
    filename:function(req,file,cb){
        cb(null,file.originalname.replace(/\.[^/.]+$/,"")+"_"+Date.now()+path.extname(file.originalname))
    }
})

let maxsize = 2*1000*1000;
let upload = multer({
    storage:storage,
    limits:{
        fileSize:maxsize
    },
    fileFilter: function(req,file,cb){
        console.log(file.mimetype);
        // console.log(file.originalname);
        let filetypes = /jpeg|jpg|png/;
        let mimetype = filetypes.test(file.mimetype);
        let extname = filetypes.test(path.extname(file.originalname));

        if(mimetype && extname){
            return cb(null,true)
        }
        cb("Error:File upload only supports the following filetypes: "+filetypes);
    }
}).single('image');

app.get('/',(req,res)=>{
    res.render('upload');
})

app.post('/upload',(req,res,next)=>{
    upload(req,res, function(err){
        if(err){
            if(err instanceof multer.MulterError && err.code == 'LIMIT_FILE_SIZE'){
                return res.send("File size is maximum 2mb");
            }
            res.send(err);
        }else{
            res.send("File uploaded successfully")
        }
    })
})


app.listen(3000,()=>{
    console.log("server run on port 3000");
})