const {AppError}=require('../lib/compat');
module.exports=(err,req,res,next)=>{if(res.headersSent)return next(err);if(err instanceof AppError)return res.status(err.status).json({error:{code:err.code,message:err.message}}); console.error(err);res.status(500).json({error:{code:'internal_error',message:'An unexpected error occurred'}})};
