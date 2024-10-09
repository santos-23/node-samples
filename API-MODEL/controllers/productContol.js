const Product = require('../models/productModel')
const asyncHandler = require('express-async-handler')

// const isAdmin = function(req, res, next) {
//     // console.log(req.user.email)
//     // console.log(req.admin.role)
//     if (req.role != 'admin') {
//         return res.status(403).json({ message: 'Forbidden' });
//     }
//     next();
// }

const getProducts = asyncHandler(async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    startIndex = (page-1)*limit;
    endIndex = page*limit;
    const results={}
    results.totalDocuments = await Product.countDocuments().exec();
    if(endIndex < await Product.countDocuments().exec()){
        results.next ={
            page : page+1,
            limit: limit
        }
    }
    if(startIndex > 0){
        results.previous ={
            page : page-1,
            limit: limit
        }
    }
    
    if(req.query.search){
        let search = req.query.search;
        const searchitem = new RegExp(search,'i')
        results.resultsFound = await Product.countDocuments({
            $or:[
                {product_name : searchitem},
                {producedBy : searchitem},
                {description : searchitem},
                {available : searchitem},
                {rating : searchitem},
            ]
        })
        results.products = await Product.find({
            $or:[
                {product_name : searchitem},
                {producedBy : searchitem},
                {description : searchitem},
                {available : searchitem},
                {rating : searchitem},
            ]
        }).limit(limit).skip(startIndex).exec();
        // results.products = await Product.find({
        //     $or:[
        //         {product_name : {$regex :'.*'+search+"*.",$options:"i"}},
        //         {producedBy : {$regex :'.*'+search+"*.",$options:"i"}},
        //         {description : {$regex :'.*'+search+"*.",$options:"i"}},
        //         {available : {$regex :'.*'+search+"*.",$options:"i"}}
        //     ]
        // }).limit(limit).skip(startIndex).exec()
    }else{
        results.products = await Product.find({}).limit(limit).skip(startIndex).exec();
    }
    res.status(200).json(results)
})

const createProduct = asyncHandler(async(req,res)=>{
    const decoded = req.user;
    console.log(decoded.role)
    if(decoded.role == 'admin'){
        const{prod_id,product_name,producedBy,available,description,rating} = req.body;
        const product = await Product.create({
            prod_id,product_name,producedBy,available,description,rating
        })
        res.status(200).json(product)
    }else{
        return res.status(403).json({ message: 'Forbidden' });
    }
})

const getProduct = asyncHandler(async(req,res)=>{
    const product = await Product.findById(req.params.id);
    if(!product){
        res.status(404);
        throw new Error("product not found")
    }
    res.status(200).json(product)
})

const updateProduct = asyncHandler(async(req,res)=>{
    const decoded = req.user;
    console.log(decoded.role);
    if(decoded.role == 'admin'){
        const product = await Product.findById(req.params.id);
        if(!product){
            res.status(404);
            throw new Error("product not found")
        }
        // if(product.prod_id.toString() !== req.user.id){
        //     res.status(403);
        //     throw new Error("user dont have permission ")
        // }
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true}
        )
        res.status(200).json(updatedProduct)
    }else{
        return res.status(403).json({ message: 'Forbidden' });
    }
})

const deleteProduct = asyncHandler(async(req,res)=>{
    const decoded = req.user;
    console.log(decoded.role);
    if(decoded.role == 'admin'){
        const product = await Product.findById(req.params.id);
        if(!product){
            res.status(404);
            throw new Error("product not found")
        }
        // if(Product.prod_id !== req.user.id){
        //     res.status(403);
        //     throw new Error("user dont have permission ")
        // }
        await Product.deleteOne({_id:req.params.id})
        res.status(200).json(product)
    }else{
        return res.status(403).json({ message: 'Forbidden' });
    }
})

module.exports = {getProducts,createProduct,getProduct,updateProduct,deleteProduct}