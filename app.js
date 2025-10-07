const video = document.getElementById("video");
const codeList = document.getElementById("codeList");
const clearBtn = document.getElementById("clearBtn");
const modeLabel = document.getElementById("mode");

let scannedCodes = JSON.parse(localStorage.getItem("codes") || "[]");
let scanning = false;

// Renderizar lista
function renderCodes() {
  codeList.innerHTML = "";
  scannedCodes.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.value;
    const span = document.createElement("span");
    span.textContent = c.time;
    span.className = "timestamp";
    li.appendChild(span);
    codeList.appendChild(li);
  });
}

// Agregar código nuevo
function addCode(value) {
  if (scannedCodes.some(c => c.value === value)) return;
  const now = new Date().toLocaleTimeString();
  scannedCodes.unshift({ value, time: now });
  localStorage.setItem("codes", JSON.stringify(scannedCodes));
  renderCodes();
  alert("Código detectado: " + value);
}

// Limpiar lista
function clearList() {
  scannedCodes = [];
  localStorage.removeItem("codes");
  renderCodes();
}
clearBtn.onclick = clearList;
renderCodes();

// Detectar Sunmi
const isSunmi = navigator.userAgent.toLowerCase().includes("sunmi");

if (isSunmi) {
  modeLabel.textContent = "📡 Modo lector láser (Sunmi)";
  let buffer = "";
  let timeout;

  window.addEventListener("keypress", e => {
    clearTimeout(timeout);
    if (e.key === "Enter") {
      if (buffer.length > 3) addCode(buffer.trim());
      buffer = "";
    } else {
      buffer += e.key;
      timeout = setTimeout(() => (buffer = ""), 100);
    }
  });
} else {
  modeLabel.textContent = "📸 Modo cámara (lector visual)";
  startCameraMode();
}

function startCameraMode() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      scanning = true;
      scan();
    })
    .catch(err => alert("No se pudo acceder a la cámara: " + err));

  function scan() {
    if (!scanning) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });
      if (code) {
        addCode(code.data);
        scanning = false;
        setTimeout(() => (scanning = true), 1500);
      }
    }
    requestAnimationFrame(scan);
  }
}
