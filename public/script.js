const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let color = '#000000';
let lastX = 0;
let lastY = 0;
let alreadyLoadedHistory = false;

// WebSocket seguro para HTTPS
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${window.location.host}`);

ws.onopen = () => {
  console.log('✅ WebSocket conectado');
};

ws.onerror = (e) => {
  console.error('❌ WebSocket error:', e);
};

ws.onclose = () => {
  console.warn('⚠️ WebSocket cerrado');
};
ws.onmessage = ({ data }) => {
  try {
    const parsed = JSON.parse(data);
    console.log('📩 Mensaje recibido:', parsed);

    if (Array.isArray(parsed) && !alreadyLoadedHistory) {
      parsed.forEach(msg => {
        if (msg.type === 'draw') drawLine(msg);
        if (msg.type === 'clear') clearCanvas(false);
      });
      alreadyLoadedHistory = true;
    }

    // ⚠️ Este bloque DEBE ejecutarse siempre para mensajes individuales
    if (!Array.isArray(parsed)) {
      if (parsed.type === 'draw') drawLine(parsed);
      if (parsed.type === 'clear') clearCanvas(false);
    }
  } catch (e) {
    console.error('Error al parsear:', e);
  }
};

canvas.addEventListener('mousedown', e => {
  drawing = true;
  [lastX, lastY] = [e.clientX, e.clientY];
});

canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseleave', () => drawing = false);

canvas.addEventListener('mousemove', e => {
  if (!drawing) return;

  const newX = e.clientX;
  const newY = e.clientY;

  const msg = {
    type: 'draw',
    fromX: lastX / canvas.width,
    fromY: lastY / canvas.height,
    toX: newX / canvas.width,
    toY: newY / canvas.height,
    color: color
  };

  drawLine(msg);
  ws.send(JSON.stringify(msg));
  [lastX, lastY] = [newX, newY];
});

function drawLine({ fromX, fromY, toX, toY, color }) {
  console.log(`🖌️ Dibujando de (${fromX}, ${fromY}) a (${toX}, ${toY}) con color ${color}`);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX * canvas.width, fromY * canvas.height);
  ctx.lineTo(toX * canvas.width, toY * canvas.height);
  ctx.stroke();
}

function clearCanvas(send = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (send) ws.send(JSON.stringify({ type: 'clear' }));
}

document.getElementById('colorPicker').addEventListener('input', e => {
  color = e.target.value;
});

function downloadCanvas() {
  const link = document.createElement('a');
  link.download = 'pizarron.png';
  link.href = canvas.toDataURL();
  link.click();
}

window.clearCanvas = clearCanvas;
window.downloadCanvas = downloadCanvas;