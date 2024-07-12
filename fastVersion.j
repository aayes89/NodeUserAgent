const express = require('express');
const os = require('os');
const path = require('path');
const useragent = require('useragent');
const app = express();
const port = 80;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/info', (req, res) => {
    const agent = useragent.parse(req.headers['user-agent']);
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const systemInfo = {
        osType: os.type(),
        osPlatform: os.platform(),
        osArch: os.arch(),
        osRelease: os.release(),
        cpuCores: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        hostname: os.hostname(),
        networkInterfaces: JSON.stringify(os.networkInterfaces(), null, 2),
        clientIp: clientIp,
        clientUserAgent: req.headers['user-agent'],
        clientBrowser: agent.toAgent(),
        clientOS: agent.os.toString(),
        clientDevice: agent.device.toString()
    };
    
    res.json(systemInfo);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

