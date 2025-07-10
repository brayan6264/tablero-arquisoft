const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

let drawHistory = []; // 💾 Guardar trazos

wss.on('connection', ws => {
    console.log('Nuevo cliente conectado');

    // 1️⃣ Enviar historial completo al nuevo cliente
    if (drawHistory.length > 0) {
        ws.send(JSON.stringify(drawHistory));
    }

    ws.on('message', message => {
        const parsed = JSON.parse(message);

        // 2️⃣ Guardar en historial si es un trazo
        if (parsed.type === 'draw') {
            drawHistory.push(parsed);
        }

        // 3️⃣ Si es limpieza, limpiar el historial
        if (parsed.type === 'clear') {
            drawHistory = [];
        }

        // 4️⃣ Enviar a todos los demás clientes
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
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
