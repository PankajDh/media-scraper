const chalk = require('chalk');

function _findReqDuration(startTime) {
    const NANO_PER_SEC = 1e9; 
    const NANO_PER_MILI = 1e6;

    const [sec, nanoSec] = process.hrtime(startTime);
    
    return (sec * NANO_PER_SEC + nanoSec) / NANO_PER_MILI;
}

function _getCurrentFormatedDate() {
    const currentTime = new Date();
    return currentTime.getFullYear() + "-" +
        (currentTime.getMonth() + 1) +
        "-" +
        currentTime.getDate() +
        " " +
        currentTime.getHours() +
        ":" +
        currentTime.getMinutes() +
        ":" +
        currentTime.getSeconds();
}


function logger(req, res,next) {
    const {method, url} = req;

    const currentDatetime = _getCurrentFormatedDate();
    const startTime = process.hrtime();

    function _consoleLogging() {
        const duration = _findReqDuration(startTime);
        const { statusCode } = res;
        const finalLog = `[${chalk.green(currentDatetime)}] ${method}:${url} ${statusCode} ${duration} ms`;
        console.log(finalLog);
    }

    res.on('finish', ()=>{
        _consoleLogging();
    });

    res.on('close', ()=> {
        _consoleLogging();
    });

    next();
}

module.exports = {
    logger
};