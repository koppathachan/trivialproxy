#! /usr/bin/env node

import * as https from 'https'
import * as http from 'http';
import * as fs from 'fs';

const append = (obj = {}, name = '', val) => ({ ...obj, [name]: val })

const processArgs = args => args.reduce((obj, arg, i) => {
    switch (arg) {
        case '--key-path':
            const key = fs.readFileSync(args[i+1], 'utf-8');
            return append(obj, 'KEY', key)
        case '--cert-path':
            const cert = fs.readFileSync(args[i+1], 'utf-8')
            return append(obj, 'CERT', cert)
        case '-prot':
            return append(obj, 'PROTOCOL', args[i+1])
        case '-sp':
        case '--service-port':
            return append(obj, 'PORT', args[i+1])
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
    PROXY_PORT,
    PORT,
    KEY,
    CERT,
    PROTOCOL
} = processArgs(process.argv.slice(1))

const getServer = (protocol = 'http', { key = '', cert = '' } = {}) => {
    if (protocol === 'http') return http.createServer();
    if (protocol === 'https') return https.createServer({
        key, cert
    });
    throw new Error('Unknown service');
}

const server = getServer(PROTOCOL, { key: KEY, cert: CERT })

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
        path: req.path || req.url,
        method: req.method,
        headers: req.headers
    };
    const preq = http.request(opts, pres => {
        console.log('proxying...')
        pres.pipe(res)
        res.writeHead(pres.statusCode, pres.headers);
    });
    req.pipe(preq);
    preq.on('error', (err) => {
        res.writeHead(500)
        res.end(err.message)
    });
})

server.listen(PORT || '4000')
console.log(server.address());
