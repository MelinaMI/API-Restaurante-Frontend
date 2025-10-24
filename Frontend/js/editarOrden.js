window.addEventListener("load", () => {
  const API_URL = "http://localhost:5107/api/v1";
  lucide.createIcons();

  let platosDisponibles = [];
  let orderId = localStorage.getItem("ordenIdEditar");
  let currentOrderItems = [];

  // ======== ELEMENTOS DEL DOM ========
  const orderNumberElem = document.getElementById("orderNumber");
  const deliveryTypeContainer = document.getElementById("deliveryTypeContainer");
  const dynamicFieldContainer = document.getElementById("dynamicFieldContainer");
  const totalItemsElem = document.getElementById("totalItems");
  const totalOrdenElem = document.getElementById("totalOrden");
  const platosActualesContainer = document.getElementById("platosActuales");
  const platosDisponiblesContainer = document.getElementById("platosDisponibles");
  const searchPlatesInput = document.getElementById("searchPlates");
  const orderNotesElem = document.getElementById("orderNotes");
  const btnGuardar = document.getElementById("btnGuardarCambios");

  const deliveryTypeFriendly = {
    "Dine in": "En mesa",
    "Take away": "Para llevar",
    "Delivery": "Delivery"
  };

  // ======== FETCH PLATOS DISPONIBLES ========
  async function fetchPlatos() {
    try {
      const res = await fetch(`${API_URL}/Dish?onlyActive=true`);
      platosDisponibles = await res.json();
      renderPlatosDisponibles(platosDisponibles);
    } catch (err) {
      console.error("Error cargando platos:", err);
      showToast("Error cargando platos","error");
      platosDisponiblesContainer.innerHTML = "<p>Error cargando platos</p>";
    }
  }

  // ======== RENDER PLATOS DISPONIBLES ========
  function renderPlatosDisponibles(lista) {
    platosDisponiblesContainer.innerHTML = "";

    if (!lista.length) {
      platosDisponiblesContainer.innerHTML = "<p>No hay platos disponibles</p>";
      return;
    }

    lista.forEach((plato) => {
      const div = document.createElement("div");
      div.className = "plato-disponible";

      div.innerHTML = `
        <img src="${plato.image || 'placeholder.jpg'}" alt="${plato.name}">
        <div class="plato-info">
          <h5>${plato.name}</h5>
          <p>${plato.description || ""}</p>
          <strong>$${plato.price?.toFixed(2) || 0}</strong>
        </div>
        <div class="plato-precio-agregar">
          <button class="btn-add">Agregar</button>
        </div>
      `;

      div.querySelector(".btn-add").addEventListener("click", () => addPlatoToOrder(plato));
      platosDisponiblesContainer.appendChild(div);
    });
  }

  // ======== AGREGAR PLATO A LA ORDEN ========
  function addPlatoToOrder(plato) {
    const existing = currentOrderItems.find(item => item.dishId === plato.id);
    if (existing) {
      existing.quantity++;
    } else {
      currentOrderItems.push({
        dishId: plato.id,
        dish: plato,
        quantity: 1,
        notes: ""
      });
    }
    renderPlatos(currentOrderItems);
  }

  // ======== CARGAR ORDEN ========
  async function cargarOrden() {
    if (!orderId) {
      showToast("No se encontró la orden para editar","error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/Order/${orderId}`);
      if (!res.ok) throw new Error("Orden no encontrada");

      const orden = await res.json();

      orderNumberElem.textContent = orden.orderNumber;
      deliveryTypeContainer.textContent = deliveryTypeFriendly[orden.deliveryType?.name] || orden.deliveryType?.name || "";

      // Campo dinámico
      dynamicFieldContainer.innerHTML = "";
      let label = "", value = "";
      switch (orden.deliveryType?.name) {
        case "Dine in":
        case "En mesa": label="Número de mesa"; value=orden.tableNumber||orden.deliverTo||""; break;
        case "Take away":
        case "Para llevar": label="Nombre"; value=orden.clientName||orden.deliverTo||""; break;
        case "Delivery": label="Dirección de entrega"; value=orden.deliverTo||""; break;
      }
      if(label){
        dynamicFieldContainer.innerHTML = `
          <label class="form-label text-secondary small">${label}</label>
          <p class="mb-0 fs-5">${value}</p>
          <hr class="my-1">
        `;
      }

      orderNotesElem.textContent = orden.notes || "";

      currentOrderItems = orden.items?.map(item => ({
        dishId: item.dish?.id || item.id,
        dish: platosDisponibles.find(p => p.id === (item.dish?.id || item.id)) || {
          name: item.dish?.name || "Plato",
          price: item.dish?.price || 0
        },
        quantity: item.quantity,
        notes: item.notes || ""
      })) || [];

      renderPlatos(currentOrderItems);

    } catch (err) {
      console.error(err);
      showToast("No se pudo cargar la orden: " + err.message,"error");
    }
  }

  // ======== RENDER PLATOS DE LA ORDEN ========
  function renderPlatos(items) {
    platosActualesContainer.innerHTML = "";
    let totalItems = 0;
    let totalAmount = 0;

    items.forEach((item) => {
      totalItems += item.quantity;
      totalAmount += (item.dish?.price || 0) * item.quantity;

      const div = document.createElement("div");
      div.className = "plato-item";

      div.innerHTML = `
        <div class="plato-info">
          <h6>${item.dish?.name || "Plato"}</h6>
          <textarea class="form-control form-control-sm mt-1" placeholder="Notas del plato...">${item.notes || ""}</textarea>
        </div>
        <div class="plato-controls">
          <button class="btn-qty btn-minus">-</button>
          <span>${item.quantity}</span>
          <button class="btn-qty btn-plus">+</button>
          <strong>$${((item.dish?.price || 0) * item.quantity).toFixed(2)}</strong>
        </div>
      `;

      const textarea = div.querySelector("textarea");
      textarea.addEventListener("input", e => item.notes = e.target.value);

      const btnMinus = div.querySelector(".btn-minus");
      const btnPlus = div.querySelector(".btn-plus");

      btnMinus.disabled = item.quantity === 1;
      btnMinus.addEventListener("click", () => { if(item.quantity>1)item.quantity--; renderPlatos(items); });
      btnPlus.addEventListener("click", () => { item.quantity++; renderPlatos(items); });

      platosActualesContainer.appendChild(div);
    });

    totalItemsElem.textContent = totalItems;
    totalOrdenElem.textContent = `$${totalAmount.toFixed(2)}`;
  }

  // ======== GUARDAR CAMBIOS ========
  async function guardarCambios() {
    try {
      const payload = {
        items: currentOrderItems.map(item => ({
          id: item.dishId,
          quantity: item.quantity,
          notes: item.notes || ""
        }))
      };

      const res = await fetch(`${API_URL}/Order/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data = null;
      try { data = await res.json(); } catch(e){}

      if (!res.ok) {
        const errorMessage = data?.message || data?.details || data?.error || "Error al actualizar la orden";
        throw new Error(errorMessage);
      }

      showToast("Orden actualizada con éxito ✅", "success");
    } catch (err) {
      console.error(err);
      showToast("No se pudo actualizar la orden: " + err.message,"error");
    }
  }

  // ======== FILTRO DE PLATOS ========
  if(searchPlatesInput){
    searchPlatesInput.addEventListener("input",()=>{
      const term = searchPlatesInput.value.toLowerCase();
      renderPlatosDisponibles(platosDisponibles.filter(p => p.name.toLowerCase().includes(term)));
    });
  }

  if(btnGuardar) btnGuardar.addEventListener("click", guardarCambios);

  // ======== INICIALIZACIÓN ========
  (async ()=>{
    await fetchPlatos();
    await cargarOrden();
    lucide.createIcons();
  })();
});
