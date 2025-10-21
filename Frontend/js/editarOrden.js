// Recuperar orden desde localStorage
let orden = JSON.parse(localStorage.getItem('ordenAEditar'));
if (!orden) {
    alert("No se encontró la orden a editar.");
    window.location.href = 'Ordenes.html';
}

// Mostrar datos generales
document.getElementById('orderNumber').textContent = orden.orderNumber || '';
document.getElementById('deliveryType').textContent = orden.deliveryType || '';
document.getElementById('deliverTo').textContent = orden.deliverTo || '';
document.getElementById('orderNotes').textContent = orden.notes || '';

// Inicializar items
orden.items = orden.items || [];

// Función para calcular total
function calcularTotal() {
    let total = orden.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('totalOrden').textContent = total.toFixed(2);
}

// Renderizar platos actuales
const platosActuales = document.getElementById('platosActuales');

function renderPlatosActuales() {
    platosActuales.innerHTML = '';
    orden.items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'plato card p-2 mb-2';
        div.innerHTML = `
            <strong>${item.name}</strong><br>
            Precio: $${item.price}<br>
            Cantidad: <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="form-control input-cantidad"><br>
            Nota: <input type="text" value="${item.note || ''}" data-index="${index}" class="form-control input-nota"><br>
            <button class="btn btn-danger btn-sm btn-eliminar" data-index="${index}">Eliminar</button>
        `;
        platosActuales.appendChild(div);
    });

    // Asociar eventos
    document.querySelectorAll('.input-cantidad').forEach(input => {
        input.addEventListener('change', (e) => {
            const i = e.target.dataset.index;
            orden.items[i].quantity = parseInt(e.target.value) || 1;
            calcularTotal();
        });
    });

    document.querySelectorAll('.input-nota').forEach(input => {
        input.addEventListener('change', (e) => {
            const i = e.target.dataset.index;
            orden.items[i].note = e.target.value;
        });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const i = e.target.dataset.index;
            orden.items.splice(i, 1);
            renderPlatosActuales();
            calcularTotal();
        });
    });

    calcularTotal();
}

// Renderizar platos disponibles (ejemplo fijo, puedes traer desde API)
const platosDisponibles = [
    { id: 1, name: 'Canelones', price: 150 },
    { id: 2, name: 'Tarta de Calabaza', price: 120 },
    { id: 3, name: 'Ensalada César', price: 100 },
];

const contPlatosDisponibles = document.getElementById('platosDisponibles');

function renderPlatosDisponibles() {
    contPlatosDisponibles.innerHTML = '';
    platosDisponibles.forEach((plato) => {
        const div = document.createElement('div');
        div.className = 'plato card p-2 mb-2';
        div.innerHTML = `
            <strong>${plato.name}</strong><br>
            Precio: $${plato.price}<br>
            <button class="btn btn-success btn-sm btn-agregar" data-id="${plato.id}">Agregar</button>
        `;
        contPlatosDisponibles.appendChild(div);
    });

    document.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const plato = platosDisponibles.find(p => p.id === id);
            if (plato) {
                // Verificar si ya existe
                const existing = orden.items.find(i => i.id === id);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    orden.items.push({ ...plato, quantity: 1, note: '' });
                }
                renderPlatosActuales();
            }
        });
    });
}

// Guardar cambios
document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
    localStorage.setItem('ordenAEditar', JSON.stringify(orden));

    try {
        const response = await fetch(`http://localhost:5107/api/v1/orders/${orden.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: orden.items, notes: orden.notes || '' })
        });
        if (!response.ok) throw new Error('Error al actualizar la orden');
        alert('Orden actualizada correctamente');
        localStorage.removeItem('ordenAEditar');
        window.location.href = 'Ordenes.html';
    } catch (err) {
        console.error(err);
        alert('No se pudo actualizar la orden');
    }
});

// Inicializar render
renderPlatosActuales();
renderPlatosDisponibles();
