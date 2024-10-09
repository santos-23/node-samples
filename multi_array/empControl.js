const {Employee} = require('./empschema')


const getEmployees = async(req,res)=>{
    const empData = await Employee.find().limit(2);
    res.status(200).json(empData)
}

const createEmployee = async(req,res)=>{
    const empData = req.body;
    await Employee.create(empData)
    .then((savedEmp)=>{
        console.log("saved successfully")
        res.status(200).json(savedEmp)
    })
    .catch((err)=>{
        res.status(500).send(err)
    })
}

const getEmployee = async(req,res)=>{
    const empData = await Employee.findById(req.params.id)
    if(!empData){
        res.status(404)
        throw new Error("Employee not found")
    }
    res.status(200).json(empData)
}


module.exports = {createEmployee,getEmployees,getEmployee};