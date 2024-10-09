const express = require('express');
const router =express.Router();
const Persons = require('./personSchema')

// router.get('/',(req,res)=>{
//     res.json("router is working");
// })

router.post('/',async(req,res)=>{
    const postperson = await new Persons({
        Name :req.body.Name,
        Age : req.body.Age
    })
    const saveperson = await postperson.save();
    res.status(200).json(saveperson)
})

module.exports = router;