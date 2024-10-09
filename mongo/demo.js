const mongoose = require('mongoose');
const express = require('express')
const app = express()
const user = require('./demouser')

mongoose.connect("mongodb://localhost:27017/userDB",{useUnifiedTopology:true,useNewUrlParser:true})
// .then(() =>{
//   console.log("connected")
// })
// .catch((err) => {
//   console.log(err)
// })
app.use(express.json())

app.get('/users',async(req,res)=>{
    const users = await user.find();
    res.status(200).json(users);
})

app.post('/users',async(req,res)=>{
    const {name,age,email,hobbies,street,city} = req.body;
    
    const newUser = await user.create({
        name,age,email,hobbies,street,city
    });
    res.status(200).json(newUser);
    console.log('user created successfully');
})

run()
async function run(){
    try{
        const user2 = await user.find();
        const user3 = await user.aggregate([
            {$match : { age:23}},
            {$sort : { name:1}},
            {$project : { _id:0,name:1,age:1}}
        ])
        const user4 = await user.aggregate([
            {
                $group: {
                    _id : '$name',
                    totalAge : {$sum: '$age'},
                    avgAge : { $avg : '$age'},
                },
            },
            {
                $project: {
                    _id :0,
                    name:'$_id',
                    totalAge:1,
                    avgAge : 1
                }
            }
        ])
        const user5 = await user.aggregate([
            {
                $unwind : '$hobbies'
            }
        ])
        // const user1 = await user.findOne({name:"Santos",email:"santos@gmail.com"})
        // const user1 = await user.create({
        //     name:"santos",
        //     age:21,
        //     email:"santos@gmail.com",
        //     hobbies: ["playing","reading","listening music"],
        //     address:{
        //         street:"abc street",city:"madurai"
        //     }
        // })
        // await user1.save()
        const user6 = await user.deleteMany({});
        // console.log(user1.namedEmail)
        // user1.sayHi();
        console.log(user2)
    }catch(e){
        console.log(e.message)
    }

    
    // const user1 = await user.create({name:"santos",age:21});
    // user1.name='sam';
    // await user1.save()
    // const user1 = new user({name:"santos",age:21})
    // await user1.save()
    
}


app.listen(3000)