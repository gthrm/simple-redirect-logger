const express = require('express')
const app = express()
const port = 3000
const rateLimit = require("express-rate-limit");
const bunyan = require('bunyan');

const log = bunyan.createLogger({name: 'ips', streams: [{path: process.env.LOG_PATH}]});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: {
            code: 429,
            message: "Too many requests from your IP. Please wait 15 Minutes",
        },
    },
});

app.use(limiter);


app.get('/', (req, res) => {

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    log.info(ip);
    res.redirect(process.env.URL_TO_REDIRECT)
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})