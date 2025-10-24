// js/toast.js (Versión que usa .show/.hide)
window.showToast =  function showToast(message, type = "info", duration = 3000, size = "medium") {
  // ... lógica de creación del contenedor ...
  let container = document.querySelector(".toast-container"); 
  if (!container) { 
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Crear toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${type} toast-${size}`;
  toast.innerHTML = message; // Usar innerHTML para el check (✅)
  container.appendChild(toast);

  // Animación de aparición
  setTimeout(() => toast.classList.add("show"), 100);

  // Animación de desaparición
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove());
  }, duration);
}