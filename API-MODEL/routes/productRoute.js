const express = require('express')
const router = express.Router();
// const User = require("../models/userModel");
// const Admin = require("../models/adminModel");
const {getProducts,createProduct,getProduct,updateProduct,deleteProduct} = require('../controllers/productContol');
const validateToken = require('../middleware/validateToken');


router.use(validateToken)
router.route('/').get(getProducts,validateToken);
router.route('/').post(createProduct,validateToken);
router.route('/:id').get(getProduct)
router.route('/:id').put(updateProduct)
router.route('/:id').delete(deleteProduct)

module.exports = router;