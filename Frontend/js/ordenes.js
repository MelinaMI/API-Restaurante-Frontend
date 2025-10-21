const API_URL = "http://localhost:5107/api/v1";
lucide.createIcons();

const emptyState = document.querySelector(".empty-state");
const ordersContainer = document.getElementById("orders");
const statActive = document.getElementById("stat-active");
const statPrep = document.getElementById("stat-prep");
const statReady = document.getElementById("stat-ready");
const statDelivered = document.getElementById("stat-delivered");
const statClosed = document.getElementById("stat-closed");
const statToday = document.getElementById("stat-today");

// ------------------- Filtros -------------------
const btnFiltrar = document.getElementById("btnFiltrar");
const btnLimpiar = document.getElementById("btnLimpiar");
const inputDesde = document.getElementById("desde");
const inputHasta = document.getElementById("hasta");
const selectEstado = document.getElementById("estado");


let ordersData = [];

const nextStatus = {
    "Pending": "In progress",
    "In progress": "Ready",
    "Ready": "Delivery",
    "Delivery": "Closed",
    "Closed": null,
    "Cancelled": null
};

const badgeColors = {
    "Pending": "pending",
    "In progress": "progress",
    "Ready": "ready",
    "Delivery": "delivered",
    "Closed": "closed",
    "Cancelled": "cancel"
};

let stats = {
    "Pending": 0,
    "In progress": 0,
    "Ready": 0,
    "Delivery": 0,
    "Closed": 0,
    "Cancelled": 0,
    "TotalToday": 0
};

const prioridadEstado = {
    "Pending": 1,
    "In progress": 2,
    "Ready": 3,
    "Delivery": 4,
    "Closed": 5,
    "Cancelled": 5
};

// ------------------- Traducción y visual -------------------
function traducirEstado(estado) {
    switch (estado) {
        case "Pending": return "Pendiente";
        case "In progress": return "En preparación";
        case "Ready": return "Lista";
        case "Delivery": return "Entregada";
        case "Closed": return "Cerrada";
        case "Cancelled": return "Cancelada";
        default: return estado;
    }
}

const deliveryTypeNames = {
    1: "Delivery",
    2: "Para llevar",
    3: "Comer en local"
};

function calcularEstadoVisual(order) {
    const estados = order.items.map(i => i.status.name);
    if (estados.every(e => e === "Cancelled")) return "Cancelled";
    return estados.reduce((min, actual) =>
        prioridadEstado[actual] < prioridadEstado[min] ? actual : min
    , estados[0]);
}

// ------------------- Textos de botones -------------------
function getNextButtonText(status) {
    switch (status) {
        case "Pending": return "Preparar";
        case "In progress": return "Listo";
        case "Ready": return "Entregar";
        case "Delivery": return "Cerrar";
        default: return "";
    }
}
// ------------------- Stats -------------------
function computeStats(orders) {
    stats = { "Pending": 0, "In progress": 0, "Ready": 0, "Delivery": 0, "Closed": 0, "TotalToday": 0 };
    const today = new Date().toISOString().split("T")[0];

    orders.forEach(o => {
        const estado = calcularEstadoVisual(o);
        if (stats[estado] !== undefined) stats[estado]++;
        if (o.createdAt.split("T")[0] === today) stats.TotalToday++;
    });

    updateStatsUI();
}

function updateStatsUI() {
    statActive.textContent = stats["Pending"] || 0;
    statPrep.textContent = stats["In progress"] || 0;
    statReady.textContent = stats["Ready"] || 0;
    statDelivered.textContent = stats["Delivery"] || 0;
    statClosed.textContent = stats["Closed"] || 0;
    statToday.textContent = stats.TotalToday || 0;
}

// ------------------- Mapeo de estado -------------------
function mapStatusToId(statusName) {
    switch (statusName) {
        case "Pending": return 1;
        case "In progress": return 2;
        case "Ready": return 3;
        case "Delivery": return 4;
        case "Closed": return 5;
        case "Cancelled": return 5;
        default: return 0;
    }
}

// ------------------- Backend -------------------
async function actualizarEstadoEnBackend(orderId, itemId, nuevoEstado) {
    try {
        const response = await fetch(`${API_URL}/Order/${orderId}/item/${itemId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ status: nuevoEstado })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Error al actualizar en backend:", error);
            alert("No se pudo actualizar el estado en la base de datos.");
        }
    } catch (err) {
        console.error("Error de red:", err);
        alert("Error de conexión con el servidor.");
    }
}

// ------------------- Actualización de ítem -------------------
async function handleItemUpdate(order, item, nuevoEstado, itemDiv, badgeOrden) {
    await actualizarEstadoEnBackend(order.orderNumber, item.id, mapStatusToId(nuevoEstado));
    item.status.name = nuevoEstado;

    const nuevoItemDiv = renderItem(order, item, badgeOrden);
    itemDiv.replaceWith(nuevoItemDiv);

    const nuevoEstadoVisual = calcularEstadoVisual(order);
    badgeOrden.className = `badge ${badgeColors[nuevoEstadoVisual]}`;
    badgeOrden.textContent = traducirEstado(nuevoEstadoVisual);

    computeStats(ordersData);
    lucide.replace();
}

// ------------------- Render Item -------------------
function renderItem(order, item, badgeOrden) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "item-block";

    const itemHeader = document.createElement("div");
    itemHeader.className = "item-header";

    const itemText = document.createElement("span");
    itemText.textContent = `${item.dish.name} x${item.quantity}`;
    itemHeader.appendChild(itemText);

    const itemBadge = document.createElement("span");
    itemBadge.className = `badge ${badgeColors[item.status.name]}`;
    itemBadge.textContent = traducirEstado(item.status.name);
    itemHeader.appendChild(itemBadge);

    itemDiv.appendChild(itemHeader);

    if (item.notes) {
        const notaItem = document.createElement("p");
        notaItem.className = "item-note";
        notaItem.innerHTML = `<i data-lucide="message-square"></i> ${item.notes}`;
        itemDiv.appendChild(notaItem);
    }

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "item-actions";

    // Botón "Siguiente"
    const next = nextStatus[item.status.name];
    if (next) {
        const btnNext = document.createElement("button");
        btnNext.className = "btn btn-next";
        btnNext.innerHTML = `${getNextButtonText(item.status.name)}`;
        btnNext.onclick = () => handleItemUpdate(order, item, next, itemDiv, badgeOrden);
        actionsDiv.appendChild(btnNext);
    }

    // Botón "Cancelar"
    if (!["Cancelled", "Closed"].includes(item.status.name)) {
        const btnCancel = document.createElement("button");
        btnCancel.className = "btn btn-cancel";
        btnCancel.textContent = "Cancelar";
        btnCancel.onclick = () => handleItemUpdate(order, item, "Cancelled", itemDiv, badgeOrden);
        actionsDiv.appendChild(btnCancel);
    }

    itemDiv.appendChild(actionsDiv);
    return itemDiv;
}

// ------------------- Crear card de orden -------------------
function createOrderCard(order) {
    const card = document.createElement("div");
    card.className = "order-card";

    const head = document.createElement("div");
    head.className = "order-head flex-between";

    const orderIdElement = document.createElement("div");
    orderIdElement.className = "order-id";
    orderIdElement.innerHTML = `<i data-lucide="user-round"></i> Orden #${order.orderNumber}`;

    const estadoVisual = calcularEstadoVisual(order);
    const badge = document.createElement("span");
    badge.className = `badge ${badgeColors[estadoVisual]}`;
    badge.textContent = traducirEstado(estadoVisual);

    head.appendChild(orderIdElement);
    head.appendChild(badge);

    const body = document.createElement("div");
    body.className = "order-body";

    const fecha = new Date(order.createdAt);
    const horaLocal = fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const hora = document.createElement("p");
    hora.className = "order-time";
    hora.innerHTML = `<i data-lucide="clock-3"></i> ${horaLocal} hs`;
    body.appendChild(hora);

    if (order.deliveryType) {
        const tipoEntrega = document.createElement("p");
        tipoEntrega.className = "order-type";
        const tipoNombre = deliveryTypeNames[order.deliveryType.id] || "Desconocido";
        tipoEntrega.innerHTML = `<i data-lucide="truck"></i> <strong>Tipo de entrega:</strong> ${tipoNombre}`;
        body.appendChild(tipoEntrega);
    }

    const address = document.createElement("p");
    address.innerHTML = `<i data-lucide="map-pin"></i> ${order.deliverTo}`;
    body.appendChild(address);

    if (order.notes) {
        const nota = document.createElement("p");
        nota.className = "order-note";
        nota.innerHTML = `<i data-lucide="sticky-note"></i> <strong>Nota:</strong> ${order.notes}`;
        body.appendChild(nota);
    }

    // --- Ítems de la orden ---
    order.items.forEach(item => {
        const itemDiv = renderItem(order, item, badge);
        body.appendChild(itemDiv);
    });

    // --- Contenedor para el total y el botón ---
    const footerActions = document.createElement("div");
    // Clase para alinear Total a la izquierda y Botón a la derecha
    footerActions.className = "order-footer-actions"; 
    
    // 1. Elemento Total
    const total = document.createElement("p");
    total.className = "order-total";
    total.innerHTML = `<i data-lucide="wallet"></i> <strong>Total:</strong> $${order.totalAmount}`;
    
    // 2. Botón de edición
    const editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.innerHTML = `<i data-lucide="pencil"></i>`;

    // Guardamos la orden en localStorage y redirigimos
    editBtn.addEventListener("click", () => {
        // Guardamos la orden completa en localStorage
        localStorage.setItem('ordenAEditar', JSON.stringify(order));
        // Redirigimos a la página de edición
        window.location.href = 'EditarOrden.html';
    });
    
    // 3. Adjuntar Total y Botón al nuevo contenedor
    footerActions.appendChild(total);
    footerActions.appendChild(editBtn);

    // 4. Adjuntar el nuevo contenedor al cuerpo de la orden
    body.appendChild(footerActions);
    
    card.appendChild(head);
    card.appendChild(body);

    return card;
}
// ------------------- Render Orders con empty state -------------------
function renderOrders(orders) {
    ordersContainer.innerHTML = "";
    if (!orders || orders.length === 0) {
        emptyState.style.display = "flex";
        return;
    } else {
        emptyState.style.display = "none";
    }

    orders.forEach(order => {
        const card = createOrderCard(order);
        ordersContainer.appendChild(card);
    });
    lucide.createIcons();
}

// ------------------- Filtros -------------------

btnFiltrar.addEventListener("click", async () => {
    const desde = inputDesde.value ? new Date(inputDesde.value) : null;
    const hasta = inputHasta.value ? new Date(inputHasta.value) : null;
    const estado = selectEstado.value; // Pending, Delivered, etc.

    try {
        // Transformar estado al ID esperado por el backend
        let statusId = null;
        switch (estado) {
            case "Pending": statusId = 1; break;
            case "In Progress": statusId = 2; break;
            case "Ready": statusId = 3; break;
            case "Delivered": statusId = 4; break;
            case "Closed": statusId = 5; break;
            
        }

        // Query params
        const query = new URLSearchParams();
        if (desde) query.append("from", desde.toISOString());
        if (hasta) query.append("to", hasta.toISOString());
        if (statusId) query.append("status", statusId);

        const url = `${API_URL}/Order?${query.toString()}`;
        const res = await fetch(url);

        if (!res.ok) {
            const error = await res.json(); // Backend devuelve mensaje en JSON
            alert(`Error al filtrar: ${error.title || error.message}`);
            return;
        }

        const data = await res.json();
        ordersData = data;
        computeStats(ordersData);
        renderOrders(ordersData);

        // Renderizado normal
        ordersContainer.innerHTML = "";
        ordersData.forEach(order => {
            const card = createOrderCard(order);
            ordersContainer.appendChild(card);
        });
        lucide.createIcons();

    } catch (err) {
        console.error("Error de red:", err);
        alert("No se pudo conectar con el servidor.");
    }
});
btnLimpiar.addEventListener("click", () => {
    // Limpiar inputs
    inputDesde.value = "";
    inputHasta.value = "";
    selectEstado.value = "";

    // Mostrar todas las órdenes
    renderOrders(ordersData);
    fetchOrders();
});
// ------------------- Fetch inicial -------------------
function fetchOrders() {
    fetch(`${API_URL}/Order`)
        .then(res => res.json())
        .then(data => {
            ordersData = data;
            ordersContainer.innerHTML = "";
            computeStats(ordersData);
            ordersData.forEach(order => {
                const card = createOrderCard(order);
                ordersContainer.appendChild(card);
            });
            lucide.createIcons();
        })
        .catch(err => console.error(err));
}

fetchOrders();

