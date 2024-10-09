const {User,order,inventory} = require('./schema')

exports.aggregation = async function(){
    try{
        const agg = await order.aggregate([
            {
                $lookup : {
                    from : "inventories",
                    localField : "item",
                    foreignField : "name",
                    as : "inventory_details"
                }
            },
            {
                $unwind : "$inventory_details"
            }
        ])
        const agg1 = await User.find();
        console.log(agg)
    }catch(err){
        console.log('error while using aggregation: '+err)
    }
}

// const agg = await user.aggregate([
//     {
//         $group:{
//             _id:'$age',
//             totalMark1 : {$sum :'$mark1'},
//             avgmark1 : { $avg : '$mark1'}
//             // totalMark2 : {$sum :'$mark2'},
//             // totalMark3 : {$sum :'$mark3'},
//         }
//     },
//     {
//         $project:{
//             _id:0,
//             standard : '$_id',
//             totalMark1 : 1,
//             avgmark1 :1
//         }
//     }
// ])

// const agg = await user.aggregate([
//     {
//         $addFields : {
//             totalMarks : {
//                 $sum : ['$mark1','$mark2','$mark3']
//             }
//         }
//     }
// ])

// const pipeline = [
//     {
//         $addFields : {
//             totalMarks : {
//                 $sum : ['$mark1','$mark2','$mark3']
//             }
//         }
//     }
// ]
// const agg = await user.updateMany({},pipeline);