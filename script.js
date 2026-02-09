/* ==========================================
   EMASI STOCK - JavaScript
   ========================================== */

const PASSWORD = 'Emasi2026';
let items = [];
let currentEditId = null;
let pendingAction = null;

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadItems();
    setupEventListeners();
});

// ==========================================
// THEME
// ==========================================
function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('theme', newTheme);
});

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Bouton ajouter
    document.getElementById('addItemBtn').addEventListener('click', openAddModal);
    
    // Modals
    document.getElementById('closeModal').addEventListener('click', closeItemModal);
    document.getElementById('cancelBtn').addEventListener('click', closeItemModal);
    document.getElementById('itemForm').addEventListener('submit', handleFormSubmit);
    
    // Password modal
    document.getElementById('closePasswordModal').addEventListener('click', closePasswordModal);
    document.getElementById('cancelPassword').addEventListener('click', closePasswordModal);
    document.getElementById('confirmPassword').addEventListener('click', validatePassword);
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validatePassword();
    });
    
    // Image modal
    document.getElementById('closeImageModal').addEventListener('click', closeImageModal);
    document.getElementById('imageModal').addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') closeImageModal();
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', filterItems);
    
    // Close modals on outside click
    document.getElementById('itemModal').addEventListener('click', (e) => {
        if (e.target.id === 'itemModal') closeItemModal();
    });
    document.getElementById('passwordModal').addEventListener('click', (e) => {
        if (e.target.id === 'passwordModal') closePasswordModal();
    });
}

// ==========================================
// FIREBASE - CHARGER LES DONNÉES
// ==========================================
function loadItems() {
    const itemsRef = window.firebaseRef(window.firebaseDB, 'stock-items');
    
    window.firebaseOnValue(itemsRef, (snapshot) => {
        items = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                items.push({
                    id: key,
                    ...data[key]
                });
            });
        }
        
        displayItems();
    });
}

// ==========================================
// AFFICHER LES ARTICLES
// ==========================================
function displayItems() {
    const tbody = document.getElementById('stockTableBody');
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="9"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    <p>Aucun article en stock</p>
                    <p style="font-size: 0.875rem;">Cliquez sur "Ajouter" pour commencer</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${escapeHtml(item.location || '')}</td>
            <td><strong>${escapeHtml(item.name || '')}</strong></td>
            <td>${item.quantity || 0}</td>
            <td>
                ${item.image ? 
                    `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="item-image" onclick="openImageModal('${escapeHtml(item.image)}')">` :
                    '<div class="no-image">Aucune</div>'
                }
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editItem('${item.id}')">Modifier</button>
                    <button class="btn-delete" onclick="deleteItem('${item.id}')">Supprimer</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// FILTRER LES ARTICLES
// ==========================================
function filterItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tbody = document.getElementById('stockTableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ==========================================
// MODALS
// ==========================================
function openAddModal() {
    openPasswordModal(() => {
        currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Nouvel article';
        document.getElementById('itemForm').reset();
        document.getElementById('itemModal').classList.add('active');
    });
}

function openEditModal(item) {
    currentEditId = item.id;
    document.getElementById('modalTitle').textContent = 'Modifier l\'article';
    document.getElementById('inputLocation').value = item.location || '';
    document.getElementById('inputName').value = item.name || '';
    document.getElementById('inputQuantity').value = item.quantity || 0;
    document.getElementById('inputImage').value = item.image || '';
    document.getElementById('itemModal').classList.add('active');
}

function closeItemModal() {
    document.getElementById('itemModal').classList.remove('active');
    currentEditId = null;
}

function openPasswordModal(action) {
    pendingAction = action;
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('passwordModal').classList.add('active');
    setTimeout(() => document.getElementById('passwordInput').focus(), 100);
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
    pendingAction = null;
}

function validatePassword() {
    const input = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('passwordError');
    
    if (input === PASSWORD) {
        closePasswordModal();
        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        }
    } else {
        errorEl.textContent = 'Mot de passe incorrect';
        errorEl.style.display = 'block';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

window.openImageModal = function(imageUrl) {
    document.getElementById('modalImageContent').src = imageUrl;
    document.getElementById('imageModal').classList.add('active');
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
}

// ==========================================
// FORM SUBMIT
// ==========================================
function handleFormSubmit(e) {
    e.preventDefault();
    
    const itemData = {
        location: document.getElementById('inputLocation').value.trim(),
        name: document.getElementById('inputName').value.trim(),
        quantity: parseInt(document.getElementById('inputQuantity').value) || 0,
        image: document.getElementById('inputImage').value.trim()
    };
    
    if (currentEditId) {
        updateItem(currentEditId, itemData);
    } else {
        addItem(itemData);
    }
}

// ==========================================
// CRUD OPERATIONS
// ==========================================
function addItem(itemData) {
    const itemsRef = window.firebaseRef(window.firebaseDB, 'stock-items');
    const newItemRef = window.firebasePush(itemsRef);
    
    window.firebaseSet(newItemRef, {
        ...itemData,
        createdAt: new Date().toISOString()
    }).then(() => {
        closeItemModal();
        showToast('Article ajouté avec succès', 'success');
    }).catch((error) => {
        console.error('Erreur:', error);
        showToast('Erreur lors de l\'ajout', 'error');
    });
}

window.editItem = function(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    openPasswordModal(() => {
        openEditModal(item);
    });
}

function updateItem(id, itemData) {
    const itemRef = window.firebaseRef(window.firebaseDB, `stock-items/${id}`);
    
    window.firebaseUpdate(itemRef, {
        ...itemData,
        updatedAt: new Date().toISOString()
    }).then(() => {
        closeItemModal();
        showToast('Article modifié avec succès', 'success');
    }).catch((error) => {
        console.error('Erreur:', error);
        showToast('Erreur lors de la modification', 'error');
    });
}

window.deleteItem = function(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    openPasswordModal(() => {
        if (confirm(`Voulez-vous vraiment supprimer "${item.name}" ?`)) {
            const itemRef = window.firebaseRef(window.firebaseDB, `stock-items/${id}`);
            
            window.firebaseRemove(itemRef).then(() => {
                showToast('Article supprimé avec succès', 'success');
            }).catch((error) => {
                console.error('Erreur:', error);
                showToast('Erreur lors de la suppression', 'error');
            });
        }
    });
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ⓘ';
    
    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// UTILITIES
// ==========================================
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==========================================
// CONSOLE LOG
// ==========================================
console.log(`
╔════════════════════════════════════╗
║      EMASI STOCK - RTE             ║
║      Système de gestion de stock   ║
║      Version 1.0                   ║
╚════════════════════════════════════╝
`);
