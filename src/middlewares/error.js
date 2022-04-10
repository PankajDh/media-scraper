function errorMiddleware(err, req, res, next) {
    
    if('statusCode' in err) {
        const {statusCode, message, stack} = err;
        res.status(statusCode).send({message, stack});
    }

    next(err);
}

module.exports = {
    errorMiddleware
};