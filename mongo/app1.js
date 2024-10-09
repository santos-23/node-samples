const express = require('express');
const {check,validationResult} = require('express-validator');
const bodyParser = require('body-parser');
const path = require('path')
const hbs = require('hbs');
const loginCollection = require('./mongodb');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:false}))

const tempPath = path.join(__dirname,'views')
app.set('view engine','hbs')
app.set('views',tempPath)


app.get('/',(req,res)=>{
    res.render('index')
})
app.get('/signup',(req,res)=>{
    res.render('signup')
})
app.get('/login',(req,res)=>{
    res.render('login')
})

var loginValidate = [
    check('name').trim().notEmpty().withMessage('Name required')
        .matches(/^[a-zA-Z ]*$/).withMessage('Only Characters with white space are allowed'),
    check('email').notEmpty().withMessage('Email Address required')
        .normalizeEmail().isEmail().withMessage('must be a valid email'),
    check('password').trim().notEmpty().withMessage('Password required')
        .isLength({ min: 5 }).withMessage('password must be minimum 5 length')
        .matches(/(?=.*?[A-Z])/).withMessage('At least one Uppercase')
        .matches(/(?=.*?[a-z])/).withMessage('At least one Lowercase')
        .matches(/(?=.*?[0-9])/).withMessage('At least one Number')
        .matches(/(?=.*?[#?!@$%^&*-])/).withMessage('At least one special character')
        .not().matches(/^$|\s+/).withMessage('White space not allowed'),
    check('number').isLength({min:10,max:10}).withMessage("must be in 10 numbers")
]

app.post('/signup',loginValidate,async(req,res)=>{
    const errors = validationResult(req);
  if (!errors.isEmpty()) {
  	return res.status(422).json({ errors: errors.array() });
  }
//   else {
//     const data = {
//         name :req.body.name,
//         password : req.body.password
//     }
//     const checking = await loginCollection.findOne({name:req.body.name})
//     try{
//         if(checking.password===req.body.password){
//             res.send("user allready exists")
//         }else{
//             await loginCollection.insertMany([data])
//         }
//     }catch(err){
//         res.send("wrong inputs")
//     }
//     return res.status(201).render('index',{naming:req.body.name})
// }
  else {
    let name = req.body.name;
    let password = req.body.password;
    res.send(`Username: ${name} Password: ${password}`);
  }
})
app.post('/login',async(req,res)=>{
    try{
        const search = await loginCollection.findOne({name:req.body.name})
        if(search.password===req.body.password){
            res.status(200).render('index',{naming:`${req.body.password}+${req.body.name}` })
        }else{
            res.send("incorrect password")
        }
    }catch(e){
        res.send("wrong details")
    }
})

app.listen(3000);