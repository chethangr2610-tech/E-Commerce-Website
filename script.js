// ========================================
// ShopEase - E-Commerce JavaScript
// ========================================

// API Base URL
const API_BASE_URL = 'https://dummyjson.com/products';

// State Management
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const cartCount = document.getElementById('cartCount');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const productModal = document.getElementById('productModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ========================================
// Initialization
// ========================================

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
    setupEventListeners();
});

// ========================================
// API Functions
// ========================================

// Fetch products from API
async function fetchProducts() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}?limit=100`);
        const data = await response.json();
        
        allProducts = data.products;
        filteredProducts = [...allProducts];
        
        renderProducts(filteredProducts);
        showLoading(false);
    } catch (error) {
        console.error('Error fetching products:', error);
        showLoading(false);
        showNoResults(true);
    }
}

// ========================================
// Render Functions
// ========================================

// Render products to the grid
function renderProducts(products) {
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        showNoResults(true);
        return;
    }
    
    showNoResults(false);
    
    products.forEach(product => {
        const card = createProductCard(product);
        productsGrid.appendChild(card);
    });
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    const discount = calculateDiscount(product.price, product.discountPercentage);
    const stars = generateStars(product.rating);
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
            ${product.discountPercentage > 0 ? `<span class="product-badge">-${Math.round(product.discountPercentage)}%</span>` : ''}
        </div>
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${product.rating}</span>
            </div>
            <div class="product-price">
                <span class="current-price">$${product.price.toFixed(2)}</span>
                ${discount.originalPrice > product.price ? `<span class="original-price">$${discount.originalPrice.toFixed(2)}</span>` : ''}
                ${discount.discount > 0 ? `<span class="discount">-${discount.discount}%</span>` : ''}
            </div>
            <button class="add-to-cart-btn" data-id="${product.id}">
                <i class="fas fa-shopping-cart"></i>
                Add to Cart
            </button>
        </div>
    `;
    
    // Add click event for modal
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.add-to-cart-btn')) {
            openProductModal(product);
        }
    });
    
    // Add to cart button event
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product.id);
    });
    
    return card;
}

// Calculate discount
function calculateDiscount(price, discountPercentage) {
    const originalPrice = price / (1 - discountPercentage / 100);
    return {
        originalPrice: originalPrice,
        discount: Math.round(discountPercentage)
    };
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// ========================================
// Cart Functions
// ========================================

// Add product to cart
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showToast(`${product.title} added to cart!`);
    
    // Update button state
    const btn = document.querySelector(`.add-to-cart-btn[data-id="${productId}"]`);
    if (btn) {
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> Added';
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }, 2000);
    }
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCartItems();
}

// Update item quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartCount();
            renderCartItems();
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart count in navbar
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

// Render cart items
function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        cartTotal.textContent = '$0.00';
        return;
    }
    
    cartItems.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.thumbnail}" alt="${item.title}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// ========================================
// Modal Functions
// ========================================

// Open product modal
function openProductModal(product) {
    const discount = calculateDiscount(product.price, product.discountPercentage);
    const stars = generateStars(product.rating);
    
    modalBody.innerHTML = `
        <div class="modal-image">
            <img src="${product.thumbnail}" alt="${product.title}">
        </div>
        <div class="modal-details">
            <div class="modal-category">${product.category}</div>
            <h2 class="modal-title">${product.title}</h2>
            <p class="modal-description">${product.description}</p>
            <div class="modal-rating">
                <span class="stars">${stars}</span>
                <span>${product.rating}</span>
            </div>
            <div class="modal-price">
                <span class="current-price">$${product.price.toFixed(2)}</span>
                ${discount.originalPrice > product.price ? `<span class="original-price">$${discount.originalPrice.toFixed(2)}</span>` : ''}
            </div>
            <div class="modal-stock">
                <i class="fas fa-check"></i> ${product.stock} items in stock
            </div>
            <div class="modal-brand">
                Brand: <span>${product.brand}</span>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id}); closeModal();">
                <i class="fas fa-shopping-cart"></i>
                Add to Cart
            </button>
        </div>
    `;
    
    productModal.classList.add('active');
}

// Close product modal
function closeModal() {
    productModal.classList.remove('active');
}

// ========================================
// Filter & Search Functions
// ========================================

// Filter products
function filterProducts() {
    let products = [...allProducts];
    
    // Search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        products = products.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Category filter
    const category = categorySelect.value;
    if (category) {
        products = products.filter(product => product.category === category);
    }
    
    // Sort
    const sortValue = sortSelect.value;
    if (sortValue) {
        switch (sortValue) {
            case 'price-asc':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'rating-desc':
                products.sort((a, b) => b.rating - a.rating);
                break;
        }
    }
    
    filteredProducts = products;
    renderProducts(filteredProducts);
}

// ========================================
// UI Helper Functions
// ========================================

// Show/hide loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
    productsGrid.style.display = show ? 'none' : 'grid';
}

// Show/hide no results message
function showNoResults(show) {
    noResults.classList.toggle('visible', show);
    productsGrid.style.display = show ? 'none' : 'grid';
}

// Show toast notification
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Open cart sidebar
function openCart() {
    renderCartItems();
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close cart sidebar
function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Search
    searchBtn.addEventListener('click', filterProducts);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterProducts();
        }
    });
    
    // Filter by category
    categorySelect.addEventListener('change', filterProducts);
    
    // Sort
    sortSelect.addEventListener('change', filterProducts);
    
    // Cart
    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    
    // Checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            showToast('Checkout functionality coming soon!');
        }
    });
    
    // Modal
    modalClose.addEventListener('click', closeModal);
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            closeModal();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeCart();
        }
    });
}

// Make functions globally available
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.closeModal = closeModal;