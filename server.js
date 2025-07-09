const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', ws => {
    console.log('Nuevo cliente conectado');

    ws.on('message', message => {
    // retransmitimos a todos los usuarios excepto al emisor
    wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
        });
    });

ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

server.listen(3000, () => console.log('Servidor en http://localhost:3000'));
