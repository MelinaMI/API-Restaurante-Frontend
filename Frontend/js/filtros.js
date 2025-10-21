// 📦 Módulo de excepciones y alertas personalizadas

export function showToast(message, type = "info", duration = 4000) {
  const container = document.getElementById("alerts-container");
  if (!container) return console.warn("No se encontró el contenedor de alertas.");

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "✔️",
    error: "❌",
    info: "ℹ️"
  };

  toast.innerHTML = `
    <span><span class="toast-icon">${icons[type] || ""}</span>${message}</span>
    <button>&times;</button>
  `;

  toast.querySelector("button").onclick = () => {
    toast.style.animation = "slideOut 0.4s forwards";
    setTimeout(() => container.removeChild(toast), 400);
  };

  container.appendChild(toast);

  setTimeout(() => {
    if (container.contains(toast)) {
      toast.style.animation = "slideOut 0.4s forwards";
      setTimeout(() => container.removeChild(toast), 400);
    }
  }, duration);
}

// 🧪 Validaciones de fechas
export function validarFechas(desdeStr, hastaStr) {
  const hoy = new Date().toISOString().split("T")[0];

  if (desdeStr && desdeStr > hoy) {
    showToast("La fecha de inicio no puede estar en el futuro", "error");
    return false;
  }

  if (hastaStr && hastaStr > hoy) {
    showToast("La fecha de fin no puede estar en el futuro", "error");
    return false;
  }

  if (desdeStr && hastaStr && desdeStr > hastaStr) {
    showToast("La fecha de inicio no puede ser posterior a la fecha de fin", "error");
    return false;
  }

  return true;
}

// 🧾 Manejo de errores de fetch
export async function manejarErrorFetch(res, fallback = "Error al procesar la solicitud") {
  let mensaje = fallback;
  try {
    const error = await res.json();
    mensaje = error.title || error.message || mensaje;
  } catch {
    console.warn("Respuesta no era JSON válido");
  }
  showToast(mensaje, "error");
}
