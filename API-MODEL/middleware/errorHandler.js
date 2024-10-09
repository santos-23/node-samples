const {constants} = require('../costants')
const errorHandler = (err,req,res,next)=>{
    const statuscode = res.statuscode? res.statuscode : 500;
    switch (statuscode) {
        case constants.VALIDATION_ERROR:
            res.json({
                Title:"validation error",
                message : err.message,
                stackTrace:err.stack
            })
            break;
        case constants.NOT_FOUND:
            res.json({
                Title:"Not found",
                message : err.message,
                stackTrace:err.stack
            })
            break;
        case constants.FORBIDDEN:
            res.json({
                Title:"forbidden error",
                message : err.message,
                stackTrace:err.stack
            })
            break;
        case constants.UNAUTHORIZED:
            res.json({
                Title:"unauthorized",
                message : err.message,
                stackTrace:err.stack
            })
            break;
        case constants.SERVER_ERROR:
            res.json({
                Title:"server error",
                message : err.message,
                stackTrace:err.stack
            })
            break;
        default:
            break;
    }
    
}

module.exports = errorHandler;