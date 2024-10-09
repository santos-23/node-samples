const express = require('express');
const {getUsers,createUser,getOrders,getInventory,createOrder,createInventory,updateUser,deleteUser} = require('./control')
const router = express.Router();

router.get('/getUser',getUsers);
router.post('/createUser',createUser);
router.put('/updateUser/:id',updateUser);
router.delete('/deleteUser/:id',deleteUser)

router.get('/getOrder',getOrders);
router.post('/createOrder',createOrder);
router.get('/getInventory',getInventory);
router.post('/createInventory',createInventory);

module.exports = router;