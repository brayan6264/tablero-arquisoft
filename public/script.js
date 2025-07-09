const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let color = '#000000';
let lastX = 0;
let lastY = 0;

// Conexión WebSocket al servidor
const ws = new WebSocket(`ws://${window.location.host}`);

// Recibir mensajes de otros usuarios
ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.type === 'draw') drawLine(msg);
  if (msg.type === 'clear') clearCanvas(false);
};

// Detectar inicio de dibujo
canvas.addEventListener('mousedown', e => {
  drawing = true;
  [lastX, lastY] = [e.clientX, e.clientY];
});

canvas.addEventListener('mouseup', () => {
  drawing = false;
});

canvas.addEventListener('mouseleave', () => {
  drawing = false;
});

// Enviar trazos normalizados
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

  drawLine(msg);  // dibujar localmente
  ws.send(JSON.stringify(msg));  // enviar a los demás

  [lastX, lastY] = [newX, newY];
});

// Dibujar línea desde coordenadas relativas
function drawLine({ fromX, fromY, toX, toY, color }) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX * canvas.width, fromY * canvas.height);
  ctx.lineTo(toX * canvas.width, toY * canvas.height);
  ctx.stroke();
}

// Limpiar el canvas local y enviar evento a los demás
function clearCanvas(send = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (send) {
    ws.send(JSON.stringify({ type: 'clear' }));
  }
}

// Cambiar el color desde el picker
document.getElementById('colorPicker').addEventListener('input', e => {
  color = e.target.value;
});

// Descargar imagen como PNG
function downloadCanvas() {
  const link = document.createElement('a');
  link.download = 'pizarron.png';
  link.href = canvas.toDataURL();
  link.click();
}

// Exponer funciones para los botones
window.clearCanvas = clearCanvas;
window.downloadCanvas = downloadCanvas;


