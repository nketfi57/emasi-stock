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
    
    // Attendre que Firebase soit chargé
    const checkFirebase = setInterval(() => {
        if (window.firebaseDB) {
            clearInterval(checkFirebase);
            console.log('✅ Firebase détecté');
            initializeApp();
        }
    }, 100);
    
    // Timeout après 5 secondes
    setTimeout(() => {
        if (!window.firebaseDB) {
            console.error('❌ Firebase non initialisé après 5 secondes');
            console.error('⚠️ Vérifiez votre configuration Firebase dans index.html');
        }
    }, 5000);
});

function initializeApp() {
    initializeTheme();
    setupEventListeners();
    loadItems();
    updateStats();
    console.log('✅ Application initialisée avec succès');
}

// ==========================================
// THEME
// ==========================================
function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    console.log('🎨 Thème actuel:', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    console.log('🎨 Thème changé:', newTheme);
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    console.log('🔧 Configuration des événements...');
    
    // Theme toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
        console.log('✅ Bouton thème configuré');
    } else {
        console.error('❌ Bouton themeToggle introuvable');
    }
    
    // Bouton ajouter
    const addBtn = document.getElementById('addItemBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
        console.log('✅ Bouton ajouter configuré');
    } else {
        console.error('❌ Bouton addItemBtn introuvable');
    }
    
    // Modals - Item
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const itemForm = document.getElementById('itemForm');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeItemModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeItemModal);
    if (itemForm) itemForm.addEventListener('submit', handleFormSubmit);
    
    // Password modal
    const closePasswordBtn = document.getElementById('closePasswordModal');
    const cancelPasswordBtn = document.getElementById('cancelPassword');
    const confirmPasswordBtn = document.getElementById('confirmPassword');
    const passwordInput = document.getElementById('passwordInput');
    
    if (closePasswordBtn) closePasswordBtn.addEventListener('click', closePasswordModal);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closePasswordModal);
    if (confirmPasswordBtn) confirmPasswordBtn.addEventListener('click', validatePassword);
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                validatePassword();
            }
        });
    }
    
    // Image modal
    const closeImageBtn = document.getElementById('closeImageModal');
    const imageModal = document.getElementById('imageModal');
    
    if (closeImageBtn) closeImageBtn.addEventListener('click', closeImageModal);
    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target.id === 'imageModal') closeImageModal();
        });
    }
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterItems);
    }
    
    // Close modals on outside click
    const itemModal = document.getElementById('itemModal');
    const passwordModal = document.getElementById('passwordModal');
    
    if (itemModal) {
        itemModal.addEventListener('click', (e) => {
            if (e.target.id === 'itemModal') closeItemModal();
        });
    }
    
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target.id === 'passwordModal') closePasswordModal();
        });
    }
    
    console.log('✅ Tous les événements configurés');
}

// ==========================================
// FIREBASE - CHARGER LES DONNÉES
// ==========================================
function loadItems() {
    if (!window.firebaseDB) {
        console.error('❌ Firebase non disponible');
        return;
    }
    
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
        
        console.log('📦 Articles chargés:', items.length);
        displayItems();
        updateStats();
    }, (error) => {
        console.error('❌ Erreur Firebase:', error);
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
    
    if (!tbody) {
        console.error('❌ Table body introuvable');
        return;
    }
    
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
    console.log('🔵 Ouverture modal ajout');
    openPasswordModal(() => {
        console.log('✅ Mot de passe validé - Ouverture formulaire');
        currentEditId = null;
        
        const modalTitle = document.getElementById('modalTitle');
        const itemForm = document.getElementById('itemForm');
        const itemModal = document.getElementById('itemModal');
        
        if (modalTitle) modalTitle.textContent = 'NOUVEL ARTICLE';
        if (itemForm) itemForm.reset();
        if (itemModal) {
            itemModal.classList.add('active');
            console.log('✅ Modal formulaire ouverte');
        }
    });
}

function openEditModal(item) {
    console.log('🔵 Ouverture modal modification');
    currentEditId = item.id;
    
    const modalTitle = document.getElementById('modalTitle');
    const inputLocation = document.getElementById('inputLocation');
    const inputName = document.getElementById('inputName');
    const inputQuantity = document.getElementById('inputQuantity');
    const inputImage = document.getElementById('inputImage');
    const itemModal = document.getElementById('itemModal');
    
    if (modalTitle) modalTitle.textContent = 'MODIFIER L\'ARTICLE';
    if (inputLocation) inputLocation.value = item.location || '';
    if (inputName) inputName.value = item.name || '';
    if (inputQuantity) inputQuantity.value = item.quantity || 0;
    if (inputImage) inputImage.value = item.image || '';
    if (itemModal) itemModal.classList.add('active');
}

function closeItemModal() {
    const itemModal = document.getElementById('itemModal');
    if (itemModal) itemModal.classList.remove('active');
    currentEditId = null;
    console.log('✅ Modal fermée');
}

function openPasswordModal(action) {
    console.log('🔑 Ouverture modal mot de passe');
    pendingAction = action;
    
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const passwordModal = document.getElementById('passwordModal');
    
    if (passwordInput) passwordInput.value = '';
    if (passwordError) passwordError.style.display = 'none';
    if (passwordModal) {
        passwordModal.classList.add('active');
        setTimeout(() => {
            if (passwordInput) passwordInput.focus();
        }, 100);
    }
}

function closePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) passwordModal.classList.remove('active');
    pendingAction = null;
    console.log('✅ Modal password fermée');
}

function validatePassword() {
    const passwordInput = document.getElementById('passwordInput');
    const errorEl = document.getElementById('passwordError');
    const input = passwordInput?.value;
    
    console.log('🔑 Validation mot de passe...');
    
    if (input === PASSWORD) {
        console.log('✅ Mot de passe CORRECT');
        closePasswordModal();
        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        }
    } else {
        console.log('❌ Mot de passe INCORRECT');
        if (errorEl) {
            errorEl.textContent = 'Mot de passe incorrect';
            errorEl.style.display = 'block';
        }
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

window.openImageModal = function(imageUrl) {
    const modalImg = document.getElementById('modalImageContent');
    const imageModal = document.getElementById('imageModal');
    
    if (modalImg) modalImg.src = imageUrl;
    if (imageModal) imageModal.classList.add('active');
}

function closeImageModal() {
    const imageModal = document.getElementById('imageModal');
    if (imageModal) imageModal.classList.remove('active');
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
    
    console.log('📝 Données du formulaire:', itemData);
    
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
    if (!window.firebaseDB) {
        console.error('❌ Firebase non disponible');
        showToast('Erreur: Firebase non initialisé', 'error');
        return;
    }
    
    const itemsRef = window.firebaseRef(window.firebaseDB, 'stock-items');
    const newItemRef = window.firebasePush(itemsRef);
    
    window.firebaseSet(newItemRef, {
        ...itemData,
        createdAt: new Date().toISOString()
    }).then(() => {
        console.log('✅ Article ajouté');
        closeItemModal();
        showToast('Article ajouté avec succès', 'success');
    }).catch((error) => {
        console.error('❌ Erreur ajout:', error);
        showToast('Erreur lors de l\'ajout', 'error');
    });
}

window.editItem = function(id) {
    const item = items.find(i => i.id === id);
    if (!item) {
        console.error('❌ Article introuvable:', id);
        return;
    }
    
    openPasswordModal(() => {
        openEditModal(item);
    });
}

function updateItem(id, itemData) {
    if (!window.firebaseDB) {
        console.error('❌ Firebase non disponible');
        showToast('Erreur: Firebase non initialisé', 'error');
        return;
    }
    
    const itemRef = window.firebaseRef(window.firebaseDB, `stock-items/${id}`);
    
    window.firebaseUpdate(itemRef, {
        ...itemData,
        updatedAt: new Date().toISOString()
    }).then(() => {
        console.log('✅ Article modifié');
        closeItemModal();
        showToast('Article modifié avec succès', 'success');
    }).catch((error) => {
        console.error('❌ Erreur modification:', error);
        showToast('Erreur lors de la modification', 'error');
    });
}

window.deleteItem = function(id) {
    const item = items.find(i => i.id === id);
    if (!item) {
        console.error('❌ Article introuvable:', id);
        return;
    }
    
    openPasswordModal(() => {
        if (confirm(`Voulez-vous vraiment supprimer "${item.name}" ?`)) {
            if (!window.firebaseDB) {
                console.error('❌ Firebase non disponible');
                showToast('Erreur: Firebase non initialisé', 'error');
                return;
            }
            
            const itemRef = window.firebaseRef(window.firebaseDB, `stock-items/${id}`);
            
            window.firebaseRemove(itemRef).then(() => {
                console.log('✅ Article supprimé');
                showToast('Article supprimé avec succès', 'success');
            }).catch((error) => {
                console.error('❌ Erreur suppression:', error);
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
    if (!container) {
        console.error('❌ Toast container introuvable');
        return;
    }
    
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
// UTILITY FUNCTIONS
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
// CONSOLE BANNER
// ==========================================
console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║      🚀 EMASI STOCK PREMIUM 🚀       ║
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

console.log('💻 Développé par KETFI NASSIM');
