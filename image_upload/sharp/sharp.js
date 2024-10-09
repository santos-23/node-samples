const express = require('express');
const sharp = require('sharp');
const app = express();

async function reSize(){
    await sharp("tree.jpg").resize({
        width:300,
        height:300
    })
    .toFormat("jpeg",{mozjpeg:true})
    .toFile('tree-resized-compressed.jpeg')
}
// reSize();

async function getMetaData(){
    try{
        const metadata = await sharp("dummy.pdf").metadata();
        console.log(metadata)
    }catch(err){
        console.log(err)
    }
}
getMetaData();

async function cropImage(){
    await sharp('tree.jpg')
    // .extract({
    //     width:500,
    //     height:500,
    //     left:50,
    //     top:50
    // }).toFile('tree-cropped.jpg')
    .extract({
        width:500,
        height:500,
        left:50,
        top:50
    }).grayscale(10).toFile('tree-grayscale.jpg')
}
// cropImage();

async function rotateImg(){
    await sharp('tree.jpg')
    .rotate(33,{background:{r:255,g:255,b:255,alpha:1}})
    .blur(5)
    .toFile('tree-rotated-blured.jpg')
}
// rotateImg();

app.listen(3000);