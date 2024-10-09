const express = require('express');
const path = require('path')
const rootDir = require('../utils/path')
const router = express.Router();

router.get('/add-product',(req,res,next)=>{
    res.sendFile(path.join(rootDir,'views','add-product.html'))
})
router.post('/add-product',(req,res,next)=>{
    console.log('form data: ',req.body)
    res.send('product submited')
})

module.exports = router;