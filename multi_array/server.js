const express = require('express');
const mongoDB = require('./dataBase');
const {Employee} = require('./empschema')
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');

mongoDB();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/emp',require('./empRoute'))

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/emp.html')
})



app.listen(8080,()=>{
    console.log('server run on port 8080')
});



// const newEmp = new Employee({
//     employees:[
//         {
//             empID:1002,
//             empName:"vasanth",
//             age:22,
//             position:"web developer",
//             address:{
//                 flatNo:24,
//                 street:"abc street",
//                 city:"madurai",
//                 state:"Tamilnadu"
//             },
//             phone:34356743432,
//             skills:["HTML","nodeJs"],
//             projects:{
//                 title:"Project A",
//                 description:"develop a web page",
//                 status:"In progress"
//             },
//             qualificationDetails:[
//                 [
//                     {
//                         qualification:"secondary",
//                         schoolName:"abc school",
//                         passingYear:2017,
//                         percentage:92
//                     }
//                 ],
//                 [
//                     {
//                         qualification:"higher secondary",
//                         schoolName:"abc school",
//                         passingYear:2019,
//                         percentage:77
//                     }
//                 ],
//                 [
//                     {
//                         qualification:"B.E(cse)",
//                         collegeName:"abc college",
//                         passingYear:2023,
//                         percentage:85
//                     }
//                 ]
//             ]
//         }
//     ]
// })

// newEmp.save()
// .then((savedEmp)=>{
//     console.log("saved successfully: ",savedEmp)
// })
// .catch((err)=>{
//     console.log(err)
// })

// Employee.findOne({"employees.empID":"1002"})
// .then((employee)=>{
//     if((!employee)){
//         console.log("emp not fouond")
//     }else{
//         // console.log(employee.employees[0])
//         console.log(employee.employees[0].address)
//         console.log(employee.employees[0].projects)
//         console.log(employee.employees[0].skills[1])
//         console.log(employee.employees[0].qualificationDetails[1][0].percentage)
//     }
// })
// .catch((err)=>{
//     console.log(err)
// })