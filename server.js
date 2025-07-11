const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

let drawHistory = []; // Guardar trazos

wss.on('connection', ws => {
    console.log('Nuevo cliente conectado');

    // Enviar historial solo al nuevo cliente
    if (drawHistory.length > 0) {
        ws.send(JSON.stringify(drawHistory));
    }

    ws.on('message', message => {
        const parsed = JSON.parse(message);

        if (parsed.type === 'draw') {
            drawHistory.push(parsed);
        }

        if (parsed.type === 'clear') {
            drawHistory = [];
            console.log('Pizarra limpiada');
        }

        // Retransmitir a todos excepto al emisor
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
