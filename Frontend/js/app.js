const API_URL = "http://localhost:5107/api/v1";
lucide.createIcons();
let platos = [];
let categorias = [];
let carrito = [];

// ================== DOMContentLoaded ==================
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    initCartSidebar();
    fetchCategorias();
    fetchPlatos();

    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    navLinks.forEach(link => {
        link.classList.remove("active", "inactive");
        const linkHref = link.getAttribute("href").split("/").pop();
        if (linkHref === currentPage || (currentPage === "" && linkHref === "index.html")) {
            link.classList.add("active");
        } else {
            link.classList.add("inactive");
        }
    });
    // ================== VALIDACIÓN CAMPOS SEGÚN MODO DE ENTREGA ==================
    document.addEventListener("DOMContentLoaded", () => {
    const mesaField = document.getElementById("mesa");
    const addressField = document.getElementById("address");
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');

    deliveryRadios.forEach(radio => {
        radio.addEventListener("change", () => {
        if (radio.value === "en_mesa" && radio.checked) {
            mesaField.required = true;
            addressField.required = false;
        } else if (radio.value === "para_llevar" && radio.checked) {
            mesaField.required = false;
            addressField.required = true;
        }
        });
    });
    });

    // Filtros
    const searchName = document.getElementById("search-name");
    const filterCategory = document.getElementById("filter-category");
    const sortPrice = document.getElementById("sort-price");

    if (searchName) searchName.addEventListener("input", applyFilters);
    if (filterCategory) filterCategory.addEventListener("change", applyFilters);
    if (sortPrice) sortPrice.addEventListener("change", applyFilters);

    const resetBtn = document.getElementById("reset-filters");
    if (resetBtn) resetBtn.addEventListener("click", () => {
        if(searchName) searchName.value = "";
        if(filterCategory) filterCategory.value = "";
        if(sortPrice) sortPrice.value = "";
        applyFilters();
        fetchPlatos();
    });
    // Botón Vaciar Carrito
    const btnVaciar = document.getElementById("btnVaciar");
    if (btnVaciar) {
        btnVaciar.addEventListener("click", () => {
            carrito = [];             // Vaciar array del carrito
            saveCart();               // Guardar cambios en localStorage
            renderCartSidebar();      // Renderizar nuevamente el sidebar
        });
    }

    initOrderForm();
});

// ================== FETCH CATEGORÍAS ==================
function fetchCategorias() {
    fetch(`${API_URL}/Category`)
        .then(res => res.json())
        .then(data => {
            categorias = data;
            const select = document.getElementById("filter-category");
            if (select) {
                categorias.forEach(cat => {
                    const option = document.createElement("option");
                    option.value = cat.id;
                    option.textContent = cat.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(err => console.error(err));
}

// ================== FETCH PLATOS ==================
function fetchPlatos() {
    fetch(`${API_URL}/Dish?onlyActive=true`)
        .then(res => res.json())
        .then(data => {
            platos = data || [];
            renderPlatos(platos);
        })
        .catch(err => {
            console.error(err);
            const container = document.getElementById("dishes");
            if (container) container.innerHTML = "<p style='color:red'>Error cargando platos</p>";
        });
}

// ================== RENDER PLATOS ==================
function renderPlatos(lista) {
    const container = document.getElementById("dishes");
    const emptyState = document.querySelector(".empty-state");

    container.innerHTML = '';

    if (!lista.length) {
        if (emptyState) emptyState.style.display = "flex"; // mostrar mensaje
        return;
    }

    if (emptyState) emptyState.style.display = "none"; // ocultar mensaje si hay platos

    lista.forEach(plato => {
        const card = document.createElement("div");
        card.className = "plato-card" + (!plato.isActive ? " inactive" : "");

        card.innerHTML = `
            <img src="${plato.image || 'placeholder.jpg'}" alt="${plato.name}">
            <h4>${plato.name}</h4>
            <p>${plato.description || ''}</p>
            <strong>$${plato.price?.toFixed(2) || ''}</strong>
            <button ${!plato.isActive ? 'disabled' : ''}>Agregar</button>
        `;

        const btn = card.querySelector("button");
        btn.addEventListener("click", () => {
            addToCart({
                id: plato.id,
                name: plato.name,
                price: plato.price
            });
        });

        container.appendChild(card);
    });
}

// ================== FILTROS ==================
function applyFilters() {
    if (!platos.length) return;

    let filtered = [...platos];
    const nameFilter = document.getElementById("search-name")?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById("filter-category")?.value || '';
    const priceOrder = document.getElementById("sort-price")?.value || '';

    if (nameFilter) filtered = filtered.filter(p => p.name.toLowerCase().includes(nameFilter));
    if (categoryFilter) filtered = filtered.filter(p => p.category?.id == categoryFilter);
    if (priceOrder) filtered.sort((a,b) => priceOrder === "asc" ? a.price - b.price : b.price - a.price);

    renderPlatos(filtered);
}

// ================== CARRITO ==================
function initCartSidebar() {
    const cartBtn = document.getElementById("cart-btn");
    const cartSidebar = document.getElementById("cart-sidebar");
    const closeCart = document.getElementById("close-cart");

    cartBtn.addEventListener("click", e => {
        e.preventDefault();
        cartSidebar.classList.toggle("open");
    });

    closeCart.addEventListener("click", () => cartSidebar.classList.remove("open"));

    document.addEventListener("click", e => {
        const isInsideSidebar = cartSidebar.contains(e.target);
        const isCartButton = cartBtn.contains(e.target);
        const isQtyButton = e.target.closest(".cart-item-qty");
        const isRemoveButton = e.target.classList.contains("cart-item-remove");

        if (cartSidebar.classList.contains("open") &&
            !isInsideSidebar &&
            !isCartButton &&
            !isQtyButton &&
            !isRemoveButton
        ) cartSidebar.classList.remove("open");
    });
}

function addToCart(plato) {
    const existing = carrito.find(item => item.id === plato.id);
    if (existing) existing.cantidad++;
    else carrito.push({...plato, cantidad:1, note:""});

    renderCartSidebar();
    saveCart();
    document.getElementById("cart-sidebar").classList.add("open");
}

function increaseQty(index) {
    carrito[index].cantidad++;
    renderCartSidebar();
    saveCart();
}

function decreaseQty(index) {
    if (carrito[index].cantidad > 1) carrito[index].cantidad--;
    else carrito.splice(index,1);
    renderCartSidebar();
    saveCart();
}

function removeFromCart(index) {
    carrito.splice(index,1);
    renderCartSidebar();
    saveCart();
}

function updateItemNote(index, value) {
    carrito[index].note = value;
    saveCart();
}

// ================== CARRITO ==================
function renderCartSidebar() {
    const container = document.getElementById("cart-items");
    const emptyBlock = document.getElementById("empty-cart");
    const orderSection = document.querySelector(".order-section");
    const btnVaciar = document.getElementById("btnVaciar");

    container.innerHTML = "";

    if (!carrito.length) {
        emptyBlock.style.display = "flex";
        orderSection.style.display = "none";
        if (btnVaciar) btnVaciar.style.display = "none"; // ocultar botón si carrito vacío
        updateCartCount();
        document.getElementById("cart-total-amount").textContent = "$0.00";
        return;
    }

    emptyBlock.style.display = "none";
    orderSection.style.display = "block";
    if (btnVaciar) btnVaciar.style.display = "inline-flex"; // mostrar botón si hay items

    let total = 0;

    carrito.forEach((item,index) => {
        total += item.price * item.cantidad;
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
        <div class="cart-item-info">
            <div class="cart-item-header">
                <p class="cart-item-title">${item.name}</p>
                <div class="cart-item-actions">
                    <div class="cart-item-qty">
                        <button onclick="decreaseQty(${index})">-</button>
                        <span>${item.cantidad}</span>
                        <button onclick="increaseQty(${index})">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
            <textarea 
                class="cart-item-note" 
                placeholder="Agregar nota para este plato..."
                oninput="updateItemNote(${index}, this.value)"
            >${item.note || ""}</textarea>
        </div>
        `;
        container.appendChild(div);
    });

    // Actualizar total final en el HTML
    document.getElementById("cart-total-amount").textContent = `$${total.toFixed(2)}`;

    updateCartCount();
    lucide.createIcons();
}



function updateCartCount() {
    document.getElementById("cart-count").textContent = carrito.reduce((sum,item)=>sum+item.cantidad,0);
}

function saveCart() {
    localStorage.setItem("carrito",JSON.stringify(carrito));
}

function loadCart() {
    const stored = localStorage.getItem("carrito");
    if(stored) carrito = JSON.parse(stored);
    renderCartSidebar();
}

// ================== FORMULARIO PEDIDO (CON MODAL) ==================
function initOrderForm() {
    const deliveryRadios = document.querySelectorAll('input[name="deliveryType"]');
    const tableGroup = document.getElementById("table-group");
    const takeawayGroup = document.getElementById("takeaway-group");
    const addressGroup = document.getElementById("address-group");
    const orderForm = document.querySelector(".order-section"); 
    const orderNote = document.getElementById("order-note");

    const checked = document.querySelector('input[name="deliveryType"]:checked');
    if (checked) {
        tableGroup.style.display = checked.value === "dinein" ? "block" : "none";
        takeawayGroup.style.display = checked.value === "takeaway" ? "block" : "none";
        addressGroup.style.display = checked.value === "delivery" ? "block" : "none";
    }

    // Cambios dinámicos según tipo de pedido
    deliveryRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            tableGroup.style.display = radio.value === "dinein" ? "block" : "none";
            takeawayGroup.style.display = radio.value === "takeaway" ? "block" : "none";
            addressGroup.style.display = radio.value === "delivery" ? "block" : "none";

            if(radio.value !== "dinein") document.getElementById("table").value = "";
            if(radio.value !== "takeaway") document.getElementById("takeaway").value = "";
            if(radio.value !== "delivery") document.getElementById("address").value = "";
        });
    });

    // Enviar pedido al endpoint
    orderForm.addEventListener("submit", async e => {
        e.preventDefault();

        const finalTotal = calculateTotal(); 
        
        const orderType = document.querySelector('input[name="deliveryType"]:checked').value;

        const deliveryId = orderType === "dinein" ? 1
                           : orderType === "takeaway" ? 2
                           : 3;

        const deliveryTo = orderType === "dinein" ? document.getElementById("table").value
                           : orderType === "takeaway" ? document.getElementById("takeaway").value
                           : document.getElementById("address").value;

        const pedido = {
            items: carrito.map(item => ({
                id: item.id,
                quantity: item.cantidad,
                notes: item.note || ""
            })),
            delivery: {
                id: deliveryId,
                to: deliveryTo
            },
            notes: orderNote.value || ""
        };

        try {
            const res = await fetch(`${API_URL}/Order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedido)
            });

            if(!res.ok) throw new Error("Error al enviar pedido");

            const data = await res.json();
            
            // 1. Mostrar el modal de éxito con los datos
            showSuccessModal(data, finalTotal); 

            // 2. Limpiar el estado
            carrito = [];
            renderCartSidebar();
            saveCart();
            orderForm.reset();
            orderNote.value = "";
            
            // 3. Resetear la UI del sidebar (mostrar mesa por defecto)
            tableGroup.style.display = "block";
            takeawayGroup.style.display = "none";
            addressGroup.style.display = "none";
            document.querySelector('input[name="deliveryType"][value="dinein"]').checked = true;

        } catch(err) {
            console.error(err);
            alert("Hubo un problema al confirmar el pedido.");
        }
    });
}

    function calculateTotal() {
        return carrito.reduce((sum,item) => sum + (item.price * item.cantidad), 0).toFixed(2);
    }

// ================== GESTIÓN DE MODAL DE ÉXITO ==================

// Función para formatear la fecha a un formato legible
function formatOrderDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('es-AR', options);
}

// Función para mostrar y llenar el modal de éxito
function showSuccessModal(orderData, finalTotal) {
    const modal = document.getElementById('order-success-modal');
    
    // Llenar los datos
    document.getElementById('modal-order-number').textContent = `#${orderData.orderNumber}`;
    document.getElementById('modal-total-amount').textContent = `$${finalTotal}`;
    document.getElementById('modal-created-at').textContent = formatOrderDate(orderData.createdAt);
    
    // Mostrar el modal
    modal.classList.add('show');
    
    // Listener para cerrar
    document.getElementById('close-success-modal').onclick = () => {
        modal.classList.remove('show');
    };
}

// ================== CONTROL DE CAMPOS SEGÚN TIPO DE PEDIDO ==================
document.addEventListener("DOMContentLoaded", () => {
  const dineInRadio = document.querySelector('input[value="dinein"]');
  const takeawayRadio = document.querySelector('input[value="takeaway"]');
  const deliveryRadio = document.querySelector('input[value="delivery"]');

  const tableGroup = document.getElementById("table-group");
  const takeawayGroup = document.getElementById("takeaway-group");
  const addressGroup = document.getElementById("address-group");

  const tableInput = document.getElementById("table");
  const takeawayInput = document.getElementById("takeaway");
  const addressInput = document.getElementById("address");

  function updateFields() {
    // Ocultar todos
    tableGroup.style.display = "none";
    takeawayGroup.style.display = "none";
    addressGroup.style.display = "none";

    // Desactivar required de todos
    tableInput.required = false;
    takeawayInput.required = false;
    addressInput.required = false;

    // Mostrar y activar según el tipo seleccionado
    if (dineInRadio.checked) {
      tableGroup.style.display = "block";
      tableInput.required = true;
    } else if (takeawayRadio.checked) {
      takeawayGroup.style.display = "block";
      takeawayInput.required = true;
    } else if (deliveryRadio.checked) {
      addressGroup.style.display = "block";
      addressInput.required = true;
    }
  }

  // Inicializar al cargar
  updateFields();

  // Escuchar cambios
  [dineInRadio, takeawayRadio, deliveryRadio].forEach(r =>
    r.addEventListener("change", updateFields)
  );
});
