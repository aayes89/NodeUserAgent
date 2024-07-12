const express = require('express');
const os = require('os');
const useragent = require('useragent');
const requestIp = require('request-ip');
const cookie = require('cookie-parser');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const port = 80;

app.use(requestIp.mw());
app.use(cookie());

const upload = multer({ dest: 'uploads/' });

// Middleware para mostrar la estructura de directorios en unidades disponibles en Windows NT
app.get('/browse', (req, res, next) => {
    const drives = getAvailableDrives();
    const basePath = drives.length > 0 ? drives[0] : ''; // Tomar la primera unidad disponible como base

    // Función para obtener las unidades disponibles en Windows NT
    function getAvailableDrives() {
        const drives = [];
        for (let charCode = 'A'.charCodeAt(0); charCode <= 'Z'.charCodeAt(0); charCode++) {
            const driveLetter = String.fromCharCode(charCode);
            if (fs.existsSync(driveLetter + ':\\')) {
                drives.push(driveLetter + ':\\');
            }
        }
        return drives;
    }

    // Función recursiva para obtener la estructura de directorios en una unidad específica
    function getDirectoryStructure(folderPath) {
        try {
            const files = fs.readdirSync(folderPath);
            const structure = [];

            files.forEach(file => {
                const fullPath = path.join(folderPath, file);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    structure.push({
                        name: file,
                        type: 'directory',
                        path: fullPath,
                        children: getDirectoryStructure(fullPath)
                    });
                } else {
                    structure.push({
                        name: file,
                        type: 'file',
                        path: fullPath
                    });
                }
            });

            return structure;
        } catch (err) {
            console.error(`Error al leer el directorio ${folderPath}: ${err}`);
            return [];
        }
    }

    // Generar HTML para mostrar la estructura de directorios
    const html = `
        <html>
        <head>
            <style>
                ul {
                    list-style-type: none;
                    padding-left: 0;
                }
                ul ul {
                    margin-left: 20px;
                }
                .file {
                    color: blue;
                    cursor: pointer;
                }
                .directory {
                    color: green;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>File Browser</h1>
            ${generateDirectoryList(basePath)} <!-- Mostrar estructura de la unidad seleccionada -->
        </body>
        </html>
    `;

    res.send(html);
});

// Middleware para mostrar la información del sistema y el explorador de archivos
app.use((req, res, next) => {
    const agent = useragent.parse(req.headers['user-agent']);
    const clientIp = req.clientIp;

    let clientOS = agent.os.toString();
    let clientDevice = agent.device.toString();

    // Análisis adicional del agente de usuario para detectar Xbox 360
    const userAgentString = req.headers['user-agent'];
    if (userAgentString.includes('Xbox')) {
        clientOS += ' (Xbox OS)';
        clientDevice += ' (Xbox 360)';
    }

    const cookieData = req.cookies;

    const systemInfo = {
        clientIp: clientIp,
        clientUserAgent: req.headers['user-agent'],
        clientBrowser: agent.toAgent(),
        clientOS: clientOS,
        clientDevice: clientDevice,
        timestamp: new Date().toISOString(),
        osType: os.type(),
        osPlatform: os.platform(),
        osArch: os.arch(),
        osRelease: os.release(),
        cpuModel: os.cpus()[0].model,
        cpuCores: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        homeDirectory: os.homedir(),
        tempDirectory: os.tmpdir(),
        networkInterfaces: os.networkInterfaces(),
        cookies: cookieData,
    };

    // Generar una tabla HTML con la información del sistema y el explorador de archivos
    const htmlTable = `
        <html>
        <head>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table, th, td {
                    border: 1px solid black;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                ul {
                    list-style-type: none;
                    padding-left: 0;
                }
                ul ul {
                    margin-left: 20px;
                }
                .file {
                    color: blue;
                    cursor: pointer;
                }
                .directory {
                    color: green;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>System Information</h1>
            <table>
                <tr><th>Key</th><th>Value</th></tr>
                <tr><td>Client IP</td><td>${systemInfo.clientIp}</td></tr>
                <tr><td>User Agent</td><td>${systemInfo.clientUserAgent}</td></tr>
                <tr><td>Browser</td><td>${systemInfo.clientBrowser}</td></tr>
                <tr><td>Operating System</td><td>${systemInfo.clientOS}</td></tr>
                <tr><td>Device</td><td>${systemInfo.clientDevice}</td></tr>
                <tr><td>Timestamp</td><td>${systemInfo.timestamp}</td></tr>
                <tr><td>OS Type</td><td>${systemInfo.osType}</td></tr>
                <tr><td>OS Platform</td><td>${systemInfo.osPlatform}</td></tr>
                <tr><td>OS Architecture</td><td>${systemInfo.osArch}</td></tr>
                <tr><td>OS Release</td><td>${systemInfo.osRelease}</td></tr>
                <tr><td>CPU Model</td><td>${systemInfo.cpuModel}</td></tr>
                <tr><td>CPU Cores</td><td>${systemInfo.cpuCores}</td></tr>
                <tr><td>Total Memory</td><td>${formatBytes(systemInfo.totalMemory)}</td></tr>
                <tr><td>Free Memory</td><td>${formatBytes(systemInfo.freeMemory)}</td></tr>
                <tr><td>Uptime</td><td>${formatUptime(systemInfo.uptime)}</td></tr>
                <tr><td>Home Directory</td><td>${systemInfo.homeDirectory}</td></tr>
                <tr><td>Temp Directory</td><td>${systemInfo.tempDirectory}</td></tr>
                <tr><td>Cookies</td><td>${JSON.stringify(systemInfo.cookies)}</td></tr>
            </table>
            
<div>
    <a href="http://cumxtv.ddns.net/idx.html">Debian Page</a>
    <a href="https://ps3xploit.me/hfw/led_status_test/led_status_test.html">Status Led</a>
    <a href="https://ps3xploit.me/storehaxx/StoreHaxx_4.83_IDPS_PSID_Dumping_Method-PS3Xploit.zip">PS3Xploit</a>
    <a href="http://cumxtv.ddns.net/">CUMXTV</a>
    <a href="https://archive.org/download/XBOX_360_XBLA">Xbox 360 ROMS</a>
    <a href="http://cumxtv.ddns.net/ENDGAME/">ENDGAME DIR</a>
    <a href="http://cumxtv.ddns.net/ENDGAME/payload.xbe">ENDGAME</a>
    <a href="https://ps3xploit.me/storehaxx/StoreHaxx_4.83_IDPS_PSID_Dumping_Method-PS3Xploit.pkg">Hack</a>
    <a href="https://www.psx-place.com/threads/ps3xploit-flash-writer-4-90-hfw.39744/">NAND Flash</a>
    <a href="https://ps3xploit.me/hfw/ssl_cert_injector_remover/ssl_cert_injector.html">Exploit PS3</a>
    <a href="http://cumxtv.ddns.net/pro">Proxy</a>
    <a href="http://cumxtv.ddns.net/ENDGAME/5841083B/000D0000/AC5A8FAAF149BA9EED8D24FA2690A4E1B0B0EC5A58" download>Tetris Xbox</a>
</div>
            <h2>File Browser</h2>
            ${generateDirectoryList(systemInfo.homeDirectory)} <!-- Mostrar estructura de directorios aquí -->
            
            <h2>Upload File</h2>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <input type="file" name="file" id="file">
                <button type="submit">Upload</button>
            </form>
        </body>
        </html>
    `;

    res.send(htmlTable);
});

// Función para generar la lista de directorios y archivos en formato HTML
function generateDirectoryList(basePath) {
    const structure = getDirectoryStructure(basePath);

    let html = '<ul>';

    structure.forEach(item => {
        if (item.type === 'directory') {
            html += `<li class="directory">${item.name}</li>`;
            html += `<ul>${generateDirectoryList(item.path)}</ul>`;
        } else {
            html += `<li class="file" data-path="${item.path}">${item.name}</li>`;
        }
    });

    html += '</ul>';

    return html;
}

// Función recursiva para obtener la estructura de directorios en una unidad específica
function getDirectoryStructure(folderPath) {
    try {
        const files = fs.readdirSync(folderPath);
        const structure = [];

        files.forEach(file => {
            const fullPath = path.join(folderPath, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                structure.push({
                    name: file,
                    type: 'directory',
                    path: fullPath,
                    children: getDirectoryStructure(fullPath)
                });
            } else {
                structure.push({
                    name: file,
                    type: 'file',
                    path: fullPath
                });
            }
        });

        return structure;
    } catch (err) {
        console.error(`Error al leer el directorio ${folderPath}: ${err}`);
        return [];
    }
}

// Funciones auxiliares para formatear la memoria y el tiempo de actividad
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const uptime = {
        days: Math.floor(seconds / (3600 * 24)),
        hours: Math.floor((seconds % (3600 * 24)) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        seconds: Math.floor(seconds % 60)
    };
    return `${uptime.days} days, ${uptime.hours} hours, ${uptime.minutes} minutes, ${uptime.seconds} seconds`;
}

// Iniciar el servidor Express
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
