const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    flatNo:Number,
    street:String,
    city:String,
    state:String
})

const empSchema1 = new mongoose.Schema({
    empID:{
        type:Number,
        required:true,
        unique:true
    },
    empName:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    position:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    joiningDate:{
        type:Date,
        default: ()=>Date.now()
    },
    skills:{
        type:[String],
        required:true
    },
    qualification:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    imageUrl:String,
    
})

const empSchema = new mongoose.Schema({
    employees:[
        {
            empID:{
                type:Number,
                required:true,
                unique:true
            },
            empName:{
                type:String,
                required:true
            },
            age:{
                type:Number,
                required:true
            },
            position:{
                type:String,
                required:true
            },
            address:addressSchema,
            phone:{
                type:Number,
                required:true
            },
            joiningDate:{
                type:Date,
                default: ()=>Date.now()
            },
            skills:{
                type:[String],
                required:true
            },
            projects:{
                title:{
                    type:String,
                    required:true
                },
                description:{
                    type:String,
                    required:true
                },
                status:{
                    type:String,
                    required:true,
                    enum:["completed","In progress","pending"]
                }
            },
            qualificationDetails:[
                [
                    {
                        qualification:{
                            type:String,
                            required:true
                        },
                        schoolName:String,
                        collegeName:String,
                        passingYear:{
                            type:Number,
                            required:true
                        },
                        percentage:{
                            type:Number,
                            required:true
                        }
                    }
                    
                ]
            ]
        }
    ]
});


const Employee = mongoose.model("Employee",empSchema1);

module.exports = {Employee};