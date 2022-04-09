const config =  require('../../config.json');

function basicAuth(req, res, next) {
    const {authUser, authPass} = config;

    const authorizationHeader = req.headers.authorization;
    if(!authorizationHeader) {
        res.status(401).send('Authentication Token is Missing');
    }

    const authComponents = authorizationHeader.split(' ');
    if (authComponents[0] !== 'Basic' || authComponents.length !== 2) {
        res.status(401).send('Invalid format of the Authentication Token');
    }

    const [user, password] = Buffer.from(authComponents[1], 'base64').toString().split(':');
    if (user && password && user === authUser && password === authPass) {
        next();
    }

    res.status(401).send('Authentication Token is not valid');
}

module.exports = {
    basicAuth
};