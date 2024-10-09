const {User,order,inventory} = require('./schema')

const getUsers = async(req,res)=>{
    const users = await User.find();
    res.status(200).json(users);
}
const getOrders = async(req,res)=>{
    const orders = await order.find();
    res.status(200).json(orders);
}

const getInventory = async(req,res)=>{
    const inventories = await inventory.find();
    res.status(200).json(inventories);
}

const createUser = async(req,res)=>{
    const {stuname,age,city,standard,mark1,mark2,mark3} = req.body;
    if(!stuname || !age || !city || !standard || !mark1 || !mark2 || !mark3){
        res.status(404);
        throw new Error('all fields are mandatory')
    }
    const newUser = await User.create({
        stuname,age,city,standard,mark1,mark2,mark3
    });
    res.status(200).json(newUser);
    console.log('user created successfully');
}

const createOrder = async(req,res)=>{
    const {_id,item,price,quantity} = req.body;
    // if(!_id || !item || !price || !quantity ){
    //     res.status(404);
    //     throw new Error('all fields are mandatory')
    // }
    const newOrder = await order.create({
        _id,item,price,quantity
    });
    res.status(200).json(newOrder);
    console.log('order created successfully');
}

const createInventory = async(req,res)=>{
    const {_id,name,description,instock} = req.body;
    // if(!_id || !name || !description || !instock){
    //     res.status(404);
    //     throw new Error('all fields are mandatory')
    // }
    const newInventory = await inventory.create({
        _id,name,description,instock
    });
    res.status(200).json(newInventory);
    console.log('inventory created successfully');
}

const updateUser = async(req,res)=>{
    try{
        const user = await User.findById(req.params.id);
        if(!user){
            res.status(404);
            throw new Error("user not found")
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true}
        )
        console.log('Updated user:', updatedUser);
        res.status(200).json(updatedUser);
        console.log('updated successfully')
    }catch(error){
        res.status(500).send('server error: '+error)
    }
}

const deleteUser = async(req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user){
            res.status(404);
            throw new Error("user not found")
        }
        const deletedUser = await User.findByIdAndDelete(
            req.params.id
        )
        console.log('deleted user: ',deletedUser)
        res.status(200).json(deletedUser)
        console.log("deleted successfully")
    }catch(error){
        res.status(500).send('server error: '+error)
    }
}

module.exports = {getUsers,createUser,getOrders,getInventory,createOrder,createInventory,updateUser,deleteUser}