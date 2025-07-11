const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let color = '#000000'; // color por defecto
let lastX = 0;
let lastY = 0;
let alreadyLoadedHistory = false;

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${window.location.host}`);

ws.onmessage = async ({ data }) => {
  try {
    let jsonString;

    if (data instanceof Blob) {
      jsonString = await data.text();
    } else if (typeof data === 'string') {
      jsonString = data;
    } else {
      jsonString = data.toString();
    }

    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed) && !alreadyLoadedHistory) {
      parsed.forEach(msg => {
        if (msg.type === 'draw') drawLine(msg);
        if (msg.type === 'clear') clearCanvas(false);
      });
      alreadyLoadedHistory = true;
    }

    if (!Array.isArray(parsed)) {
      if (parsed.type === 'draw') drawLine(parsed);
      if (parsed.type === 'clear') clearCanvas(false);
    }

  } catch (e) {
    console.error('❌ Error al parsear:', data, e);
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

function downloadCanvas() {
  const link = document.createElement('a');
  link.download = 'pizarron.png';
  link.href = canvas.toDataURL();
  link.click();
}

window.clearCanvas = clearCanvas;
window.downloadCanvas = downloadCanvas;

// Color picker personalizado y selección visual
const colorButtons = document.querySelectorAll('.color-btn');
const customColorBtn = document.getElementById('customColorBtn');
const hiddenColorInput = document.getElementById('hiddenColorInput');

function selectColor(button, selectedColor) {
  color = selectedColor;

  // Quitar clase 'selected' de todos los botones
  colorButtons.forEach(btn => btn.classList.remove('selected'));

  // Marcar el botón activo
  button.classList.add('selected');
}

// Asignar a los botones predefinidos
colorButtons.forEach(button => {
  const colorValue = button.getAttribute('data-color');
  if (colorValue) {
    button.addEventListener('click', () => {
      selectColor(button, colorValue);
    });
  }
});

// Botón personalizado
customColorBtn.addEventListener('click', () => {
  hiddenColorInput.click();
});

hiddenColorInput.addEventListener('input', (e) => {
  const selectedCustomColor = e.target.value;
  selectColor(customColorBtn, selectedCustomColor);
  customColorBtn.style.backgroundColor = selectedCustomColor;
  customColorBtn.style.border = '2px solid #000';
});

// Establecer negro como color inicial
const defaultBtn = document.querySelector('.color-btn[data-color="#000000"]');
if (defaultBtn) {
  selectColor(defaultBtn, '#000000');
}
