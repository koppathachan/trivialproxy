#! /usr/bin/env node

import * as http from 'http'

const server = http.createServer()

const append = (obj = {}, name = '', val) => ({ ...obj, [name]: val })

const processArgs = args => args.reduce((obj, arg, i) => {
    switch (arg) {
        case '-h':
        case '--proxy-host':
            return append(obj, 'PROXY_HOST', args[i+1])
        case '-p':
        case '--proxy-port':
            return append(obj, 'PROXY_PORT', args[i+1])
        default:
            return obj
    }
}, {});

const {
    PROXY_HOST,
    PROXY_PORT
} = processArgs(process.argv.slice(1))

server.on('request', (req, res) => {
    res.on('error', console.error);
    req.on('error', err => {
        console.error(err)
        res.statusCode = 500;
        res.end()
    })
    const opts = {
        host: PROXY_HOST || 'localhost',
        port: PROXY_PORT || '3002',
        path: req.path,
        method: req.method,
        headers: req.headers
    };
    const preq = http.request(opts, pres => {
        pres.pipe(res)
        res.writeHead(pres.statusCode, pres.headers);
    })
    req.pipe(preq);
})

server.listen(4000)
