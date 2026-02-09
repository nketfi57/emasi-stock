/* ==========================================
   EMASI STOCK PREMIUM - JavaScript
   ========================================== */

const PASSWORD = 'Emasi2026';
let items = [];
let currentEditId = null;
let pendingAction = null;

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 EMASI STOCK PREMIUM - Initialisation...');
    initializeTheme();
    loadItems();
    setupEventListeners();
    updateStats();
});

// ==========================================
// THEME
// ==========================================
function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

document.getElementById('themeToggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Bouton ajouter
    document.getElementById('addItemBtn')?.addEventListener('click', openAddModal);
    
    // Modals
    document.getElementById('closeModal')?.addEventListener('click', closeItemModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeItemModal);
    document.getElementById('itemForm')?.addEventListener('submit', handleFormSubmit);
    
    // Password modal
    document.getElementById('closePasswordModal')?.addEventListener('click', closePasswordModal);
    document.getElementById('cancelPassword')?.addEventListener('click', closePasswordModal);
    document.getElementById('confirmPassword')?.addEventListener('click', validatePassword);
    document.getElementById('passwordInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validatePassword();
    });
    
    // Image modal
    document.getElementById('closeImageModal')?.addEventListener('click', closeImageModal);
    document.getElementById('imageModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') closeImageModal();
    });
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', filterItems);
    
    // Close modals on outside click
    document.getElementById('itemModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'itemModal') closeItemModal();
    });
    document.getElementById('passwordModal')?.addEventListener('click', (e) => {
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
        updateStats();
    });
}

// ==========================================
// UPDATE STATS
// ==========================================
function updateStats() {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const totalItemsEl = document.getElementById('totalItems');
    const totalQuantityEl = document.getElementById('totalQuantity');
    
    if (totalItemsEl) {
        animateNumber(totalItemsEl, parseInt(totalItemsEl.textContent) || 0, totalItems);
    }
    
    if (totalQuantityEl) {
        animateNumber(totalQuantityEl, parseInt(totalQuantityEl.textContent) || 0, totalQuantity);
    }
}

function animateNumber(element, start, end) {
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ==========================================
// AFFICHER LES ARTICLES
// ==========================================
function displayItems() {
    const tbody = document.getElementById('stockTableBody');
    
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="9"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    <p>AUCUN ARTICLE EN STOCK</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Cliquez sur "NOUVEL ARTICLE" pour commencer</p>
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
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const tbody = document.getElementById('stockTableBody');
    
    if (!tbody) return;
    
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
    console.log('🔵 Bouton Ajouter cliqué');
    console.log('🔵 Appel de openPasswordModal...');
    openPasswordModal(() => {
        console.log('✅ Mot de passe validé - Ouverture formulaire');
        currentEditId = null;
        
        const modalTitle = document.getElementById('modalTitle');
        const itemForm = document.getElementById('itemForm');
        const itemModal = document.getElementById('itemModal');
        
        console.log('📋 modalTitle:', modalTitle);
        console.log('📋 itemForm:', itemForm);
        console.log('📋 itemModal:', itemModal);
        
        if (modalTitle) modalTitle.textContent = 'NOUVEL ARTICLE';
        if (itemForm) itemForm.reset();
        if (itemModal) {
            itemModal.classList.add('active');
            console.log('✅ Modal active ajoutée !');
        } else {
            console.error('❌ itemModal introuvable !');
        }
    });
}

function openEditModal(item) {
    currentEditId = item.id;
    document.getElementById('modalTitle').textContent = 'MODIFIER L\'ARTICLE';
    document.getElementById('inputLocation').value = item.location || '';
    document.getElementById('inputName').value = item.name || '';
    document.getElementById('inputQuantity').value = item.quantity || 0;
    document.getElementById('inputImage').value = item.image || '';
    document.getElementById('itemModal')?.classList.add('active');
}

function closeItemModal() {
    document.getElementById('itemModal')?.classList.remove('active');
    currentEditId = null;
}

function openPasswordModal(action) {
    console.log('🔑 openPasswordModal appelée');
    pendingAction = action;
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    
    if (passwordInput) passwordInput.value = '';
    if (passwordError) passwordError.style.display = 'none';
    
    document.getElementById('passwordModal')?.classList.add('active');
    console.log('🔑 Modal de mot de passe ouverte');
    
    setTimeout(() => {
        document.getElementById('passwordInput')?.focus();
    }, 100);
}

function closePasswordModal() {
    document.getElementById('passwordModal')?.classList.remove('active');
    pendingAction = null;
}

function validatePassword() {
    const input = document.getElementById('passwordInput')?.value;
    const errorEl = document.getElementById('passwordError');
    
    console.log('🔑 Validation du mot de passe...');
    console.log('🔑 Input:', input);
    console.log('🔑 PASSWORD attendu:', PASSWORD);
    console.log('🔑 Match:', input === PASSWORD);
    
    if (input === PASSWORD) {
        console.log('✅ Mot de passe CORRECT !');
        closePasswordModal();
        if (pendingAction) {
            console.log('🚀 Exécution de l\'action pendante...');
            pendingAction();
            pendingAction = null;
        } else {
            console.error('❌ Aucune action pendante !');
        }
    } else {
        console.log('❌ Mot de passe INCORRECT !');
        if (errorEl) {
            errorEl.textContent = 'Mot de passe incorrect';
            errorEl.style.display = 'block';
        }
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

window.openImageModal = function(imageUrl) {
    document.getElementById('modalImageContent').src = imageUrl;
    document.getElementById('imageModal')?.classList.add('active');
}

function closeImageModal() {
    document.getElementById('imageModal')?.classList.remove('active');
}

// ==========================================
// FORM SUBMIT
// ==========================================
function handleFormSubmit(e) {
    e.preventDefault();
    
    const itemData = {
        location: document.getElementById('inputLocation')?.value.trim() || '',
        name: document.getElementById('inputName')?.value.trim() || '',
        quantity: parseInt(document.getElementById('inputQuantity')?.value) || 0,
        image: document.getElementById('inputImage')?.value.trim() || ''
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
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    const icon = icons[type] || icons.info;
    
    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
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
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ==========================================
// CONSOLE ART
// ==========================================
console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║      🚀 EMASI STOCK  🚀       ║
║                                       ║
║   Système de gestion ultra-moderne   ║
║     Réseau de Transport RTE          ║
║                                       ║
║          Version 2.0 Premium          ║
║                                       ║
╚═══════════════════════════════════════╝

✨ Design: Cyber Futuriste
🎨 Animations: Premium
🔒 Sécurité: Maximale
⚡ Performance: Optimale

Mot de passe: Emasi2026
`);
//KETFI NASSIM IS THE BEST DEV OAT
