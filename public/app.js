// =====================================================
// THE FISH MERCHNAT- SEAFOOD QUICK COMMERCE APPLICATION
// =====================================================

// State Management
let state = {
  currentPage: 'home',
  previousPages: [],
  selectedCategory: null,
  selectedProduct: null,
  cart: { items: [], couponCode: null, couponDiscount: 0 },
  deliveryOption: 'standard',
  heroSlideIndex: 0,
  searchQuery: '',
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initApp()
})

function initApp() {
  // Load data from window.appData
  state.cart = window.appData.cart

  // Render initial content
  renderHomeCategories()
  renderCurrentHits()
  renderFishProducts()
  renderPrawnsProducts()
  renderReadyToCookProducts()
  renderAllCategories()
  initHeroSlider()
  updateCartUI()

  // Set admin date
  const dateEl = document.getElementById('admin-date')
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Handle browser back button
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      showPage(e.state.page, false)
    }
  })

  // Push initial state
  history.pushState({ page: 'home' }, '', '#home')
}

// =====================================================
// NAVIGATION
// =====================================================

function navigateTo(page, data = null) {
  state.previousPages.push(state.currentPage)
  showPage(page, true, data)
}

function showPage(page, pushState = true, data = null) {
  // Hide all pages
  document
    .querySelectorAll('.page')
    .forEach((p) => p.classList.remove('active'))

  // Show selected page
  const pageEl = document.getElementById(`${page}-page`)
  if (pageEl) {
    pageEl.classList.add('active')
  }

  // Update nav
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.page === page)
  })

  // Update state
  state.currentPage = page

  // Push to history
  if (pushState) {
    history.pushState({ page }, '', `#${page}`)
  }

  // Page-specific initialization
  if (page === 'search') {
    setTimeout(() => {
      document.getElementById('search-input')?.focus()
    }, 100)
  }

  // Scroll to top
  window.scrollTo(0, 0)
}

function goBack() {
  if (state.previousPages.length > 0) {
    const prevPage = state.previousPages.pop()
    showPage(prevPage, true)
  } else {
    navigateTo('home')
  }
}

// =====================================================
// HERO SLIDER
// =====================================================

function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide')
  const dots = document.querySelectorAll('.hero-dots .dot')

  if (slides.length === 0) return

  // Auto slide
  setInterval(() => {
    state.heroSlideIndex = (state.heroSlideIndex + 1) % slides.length
    updateHeroSlide()
  }, 5000)

  // Dot click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      state.heroSlideIndex = index
      updateHeroSlide()
    })
  })

  // Slide click handlers
  slides.forEach((slide) => {
    slide.addEventListener('click', () => {
      const linkType = slide.dataset.link
      const linkId = slide.dataset.id
      if (linkType === 'category') {
        openCategory(linkId)
      } else if (linkType === 'product') {
        openProduct(linkId)
      }
    })
  })
}

function updateHeroSlide() {
  const slides = document.querySelectorAll('.hero-slide')
  const dots = document.querySelectorAll('.hero-dots .dot')

  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === state.heroSlideIndex)
  })

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === state.heroSlideIndex)
  })
}

// =====================================================
// RENDER FUNCTIONS
// =====================================================

function renderHomeCategories() {
  const container = document.getElementById('home-categories')
  if (!container) return

  const topCategories = window.appData.categories.slice(0, 5)

  container.innerHTML =
    topCategories
      .map(
        (cat) => `
        <div class="category-card" onclick="openCategory('${cat.id}')">
            <img src="${cat.image}" alt="${cat.name}" class="category-image">
            <span class="category-name">${cat.name}</span>
        </div>
    `,
      )
      .join('') +
    `
        <div class="category-card" onclick="navigateTo('categories')">
            <div class="category-image" style="background: var(--primary-light); display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" style="width: 28px; height: 28px;">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
            </div>
            <span class="category-name">See All</span>
        </div>
    `
}

function renderProductCard(product) {
  const cartItem = state.cart.items.find((item) => item.id === product.id)
  const quantity = cartItem ? cartItem.quantity : 0

  const badgeClass =
    product.badge === 'bestseller'
      ? 'bestseller'
      : product.badge === 'new'
        ? 'new'
        : ''
  const stockClass = !product.inStock ? 'out-of-stock' : ''

  return `
        <div class="product-card ${stockClass}" data-id="${product.id}">
            <div class="product-image-wrapper" onclick="openProduct('${product.id}')">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                ${product.badge ? `<span class="product-badge ${badgeClass}">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h4 class="product-name" onclick="openProduct('${product.id}')">${product.name}</h4>
                <p class="product-weight">${product.weight} | ${product.pieces} | Serves ${product.serves}</p>
                <div class="product-price-row">
                    <div class="product-price">
                        <span class="current-price">₹${product.price}</span>
                        ${
                          product.originalPrice > product.price
                            ? `
                            <span class="original-price">₹${product.originalPrice}</span>
                            <span class="discount-badge">${product.discount}% off</span>
                        `
                            : ''
                        }
                    </div>
                    ${
                      product.inStock
                        ? quantity > 0
                          ? `
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="event.stopPropagation(); updateCart('${product.id}', ${quantity - 1})">−</button>
                            <span class="qty-value">${quantity}</span>
                            <button class="qty-btn" onclick="event.stopPropagation(); updateCart('${product.id}', ${quantity + 1})">+</button>
                        </div>
                    `
                          : `
                        <button class="add-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add
                        </button>
                    `
                        : ''
                    }
                </div>
            </div>
        </div>
    `
}

function renderCurrentHits() {
  const container = document.getElementById('current-hits')
  if (!container) return

  const hits = window.appData.products
    .filter((p) => p.badge === 'bestseller' || p.badge === 'new')
    .slice(0, 6)
  container.innerHTML = hits.map(renderProductCard).join('')
}

function renderFishProducts() {
  const container = document.getElementById('fish-products')
  if (!container) return

  const fishProducts = window.appData.products
    .filter((p) => p.category === 'fish')
    .slice(0, 6)
  container.innerHTML = fishProducts.map(renderProductCard).join('')
}

function renderPrawnsProducts() {
  const container = document.getElementById('prawns-products')
  if (!container) return

  const prawnsProducts = window.appData.products
    .filter((p) => p.category === 'prawns' || p.category === 'crabs')
    .slice(0, 6)
  container.innerHTML = prawnsProducts.map(renderProductCard).join('')
}

function renderReadyToCookProducts() {
  const container = document.getElementById('ready-to-cook-products')
  if (!container) return

  const rtcProducts = window.appData.products
    .filter((p) => p.category === 'ready-to-cook' || p.category === 'combos')
    .slice(0, 6)
  container.innerHTML = rtcProducts.map(renderProductCard).join('')
}

function renderAllCategories() {
  const container = document.getElementById('all-categories')
  if (!container) return

  container.innerHTML = window.appData.categories
    .map(
      (cat) => `
        <div class="category-item" data-id="${cat.id}">
            <div class="category-header" onclick="toggleCategory('${cat.id}')">
                <img src="${cat.image}" alt="${cat.name}" class="category-icon">
                <div class="category-info">
                    <h4>${cat.name}</h4>
                    <p>${cat.description}</p>
                </div>
                <div class="category-expand">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <div class="subcategories">
                <div class="subcategory-grid">
                    ${cat.subcategories
                      .map(
                        (sub) => `
                        <div class="subcategory-card" onclick="openSubcategory('${cat.id}', '${sub.id}')">
                            <img src="${sub.image}" alt="${sub.name}" class="subcategory-image">
                            <span class="subcategory-name">${sub.name}</span>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
    `,
    )
    .join('')
}

function toggleCategory(catId) {
  const item = document.querySelector(`.category-item[data-id="${catId}"]`)
  if (item) {
    const wasExpanded = item.classList.contains('expanded')
    // Close all
    document
      .querySelectorAll('.category-item')
      .forEach((el) => el.classList.remove('expanded'))
    // Toggle this one
    if (!wasExpanded) {
      item.classList.add('expanded')
    }
  }
}

function openCategory(catId) {
  const category = window.appData.categories.find((c) => c.id === catId)
  if (!category) return

  state.selectedCategory = category

  // Update hero
  document.getElementById('category-hero-image').src = category.heroImage
  document.getElementById('category-hero-image').alt = category.name
  document.getElementById('category-title').textContent = category.name
  document.getElementById('category-subtitle').textContent =
    category.description

  // Get products
  const categoryProducts = window.appData.products.filter(
    (p) => p.category === catId,
  )

  // Update count
  document.getElementById('products-count').textContent =
    `${categoryProducts.length} items available`

  // Render products
  const container = document.getElementById('category-products')
  container.innerHTML = categoryProducts.map(renderProductCard).join('')

  navigateTo('products')
}

function openSubcategory(catId, subId) {
  const category = window.appData.categories.find((c) => c.id === catId)
  const subcategory = category?.subcategories.find((s) => s.id === subId)
  if (!category || !subcategory) return

  state.selectedCategory = { ...category, currentSubcategory: subcategory }

  // Update hero
  document.getElementById('category-hero-image').src = subcategory.image
  document.getElementById('category-hero-image').alt = subcategory.name
  document.getElementById('category-title').textContent = subcategory.name
  document.getElementById('category-subtitle').textContent =
    `${category.name} - Fresh & delicious`

  // Get products
  const subProducts = window.appData.products.filter(
    (p) => p.category === catId && p.subcategory === subId,
  )

  // Update count
  document.getElementById('products-count').textContent =
    `${subProducts.length} items available`

  // Render products
  const container = document.getElementById('category-products')
  container.innerHTML =
    subProducts.length > 0
      ? subProducts.map(renderProductCard).join('')
      : `<div class="cart-empty" style="grid-column: 1/-1;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
            </svg>
            <h3>No products found</h3>
            <p>Check back soon for new arrivals!</p>
        </div>`

  navigateTo('products')
}

function openProduct(productId) {
  const product = window.appData.products.find((p) => p.id === productId)
  if (!product) return

  state.selectedProduct = product
  const cartItem = state.cart.items.find((item) => item.id === product.id)
  const quantity = cartItem ? cartItem.quantity : 0

  const container = document.getElementById('product-detail')
  container.innerHTML = `
        <div class="product-detail-images">
            <img src="${product.images[0]}" alt="${product.name}" class="product-detail-image" id="main-product-image">
            ${
              product.images.length > 1
                ? `
                <div class="image-dots">
                    ${product.images
                      .map(
                        (_, i) => `
                        <span class="dot ${i === 0 ? 'active' : ''}" onclick="changeProductImage(${i})"></span>
                    `,
                      )
                      .join('')}
                </div>
            `
                : ''
            }
        </div>
        <div class="product-detail-info">
            ${product.badge ? `<span class="product-badge ${product.badge === 'bestseller' ? 'bestseller' : product.badge === 'new' ? 'new' : ''}" style="position: static; margin-bottom: 12px;">${product.badge.toUpperCase()}</span>` : ''}
            <h1 class="product-detail-name">${product.name}</h1>
            <p class="product-detail-desc">${product.description}</p>
            
            <div class="product-detail-meta">
                <div class="meta-item">
                    <span class="meta-label">Weight</span>
                    <span class="meta-value">${product.weight}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Pieces</span>
                    <span class="meta-value">${product.pieces}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Serves</span>
                    <span class="meta-value">${product.serves}</span>
                </div>
            </div>
            
            <div class="product-detail-price">
                <span class="detail-current-price">₹${product.price}</span>
                ${
                  product.originalPrice > product.price
                    ? `
                    <span class="detail-original-price">₹${product.originalPrice}</span>
                    <span class="detail-discount">${product.discount}% off</span>
                `
                    : ''
                }
            </div>
            
            <div class="delivery-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                <span>${product.deliveryTime}</span>
            </div>
            
            <div class="product-highlights">
                <h4>Why you'll love it</h4>
                <div class="highlight-list">
                    ${product.highlights
                      .map(
                        (h) => `
                        <div class="highlight-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            <span>${h}</span>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
        
        <div class="product-detail-actions" id="product-actions">
            ${
              product.inStock
                ? quantity > 0
                  ? `
                <div class="detail-qty-control">
                    <button class="detail-qty-btn" onclick="updateCart('${product.id}', ${quantity - 1}); renderProductActions();">−</button>
                    <span class="detail-qty-value">${quantity}</span>
                    <button class="detail-qty-btn" onclick="updateCart('${product.id}', ${quantity + 1}); renderProductActions();">+</button>
                </div>
                <button class="detail-add-btn" onclick="navigateTo('cart')">
                    View Cart - ₹${state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                </button>
            `
                  : `
                <button class="detail-add-btn" onclick="addToCart('${product.id}'); renderProductActions();">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                    </svg>
                    Add to Cart - ₹${product.price}
                </button>
            `
                : `
                <button class="detail-add-btn" style="background: var(--text-muted); cursor: not-allowed;">
                    Out of Stock
                </button>
            `
            }
        </div>
    `

  navigateTo('product-detail')
}

function renderProductActions() {
  const product = state.selectedProduct
  if (!product) return

  const cartItem = state.cart.items.find((item) => item.id === product.id)
  const quantity = cartItem ? cartItem.quantity : 0

  const container = document.getElementById('product-actions')
  if (!container) return

  container.innerHTML = product.inStock
    ? quantity > 0
      ? `
        <div class="detail-qty-control">
            <button class="detail-qty-btn" onclick="updateCart('${product.id}', ${quantity - 1}); renderProductActions();">−</button>
            <span class="detail-qty-value">${quantity}</span>
            <button class="detail-qty-btn" onclick="updateCart('${product.id}', ${quantity + 1}); renderProductActions();">+</button>
        </div>
        <button class="detail-add-btn" onclick="navigateTo('cart')">
            View Cart - ₹${state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)}
        </button>
    `
      : `
        <button class="detail-add-btn" onclick="addToCart('${product.id}'); renderProductActions();">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            Add to Cart - ₹${product.price}
        </button>
    `
    : `
        <button class="detail-add-btn" style="background: var(--text-muted); cursor: not-allowed;">
            Out of Stock
        </button>
    `
}

function changeProductImage(index) {
  const product = state.selectedProduct
  if (!product || !product.images[index]) return

  document.getElementById('main-product-image').src = product.images[index]
  document.querySelectorAll('.product-detail-images .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index)
  })
}

// =====================================================
// CART FUNCTIONS
// =====================================================

function addToCart(productId) {
  const product = window.appData.products.find((p) => p.id === productId)
  if (!product || !product.inStock) return

  const existingItem = state.cart.items.find((item) => item.id === productId)
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    state.cart.items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: product.weight,
      image: product.images[0],
      quantity: 1,
    })
  }

  updateCartUI()
  showToast(`${product.name} added to cart`, 'success')
  refreshProductCards()
}

function updateCart(productId, quantity) {
  if (quantity <= 0) {
    state.cart.items = state.cart.items.filter((item) => item.id !== productId)
  } else {
    const item = state.cart.items.find((item) => item.id === productId)
    if (item) {
      item.quantity = quantity
    }
  }

  updateCartUI()
  refreshProductCards()
}

function refreshProductCards() {
  // Refresh all product displays
  renderCurrentHits()
  renderFishProducts()
  renderPrawnsProducts()
  renderReadyToCookProducts()

  // Refresh category products if on products page
  if (state.currentPage === 'products' && state.selectedCategory) {
    const catId = state.selectedCategory.id
    const subId = state.selectedCategory.currentSubcategory?.id
    const products = subId
      ? window.appData.products.filter(
          (p) => p.category === catId && p.subcategory === subId,
        )
      : window.appData.products.filter((p) => p.category === catId)
    document.getElementById('category-products').innerHTML = products
      .map(renderProductCard)
      .join('')
  }

  // Refresh search results
  if (state.currentPage === 'search' && state.searchQuery) {
    handleSearch(state.searchQuery)
  }
}

function updateCartUI() {
  const totalItems = state.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )
  const totalPrice = state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  // Update floating cart
  const floatingCart = document.getElementById('floating-cart')
  if (floatingCart) {
    floatingCart.style.display = totalItems > 0 ? 'flex' : 'none'
  }

  document.getElementById('cart-badge').textContent = totalItems
  document.getElementById('cart-items-count').textContent =
    `${totalItems} item${totalItems !== 1 ? 's' : ''}`
  document.getElementById('cart-total').textContent = `₹${totalPrice}`

  // Render cart page content
  renderCartPage()
}

function renderCartPage() {
  const container = document.getElementById('cart-content')
  if (!container) return

  if (state.cart.items.length === 0) {
    container.innerHTML = `
            <div class="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button class="btn btn-primary" onclick="navigateTo('home')" style="max-width: 200px;">
                    Start Shopping
                </button>
            </div>
        `
    return
  }

  const itemTotal = state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const originalTotal = state.cart.items.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0,
  )
  const deliveryOption = window.appData.deliveryOptions.find(
    (o) => o.id === state.deliveryOption,
  )
  const deliveryFee = deliveryOption?.fee || 39
  const packingFee = 10
  const savings = originalTotal - itemTotal + state.cart.couponDiscount
  const gst = Math.round(itemTotal * 0.05)
  const totalAmount =
    itemTotal + deliveryFee + packingFee + gst - state.cart.couponDiscount

  container.innerHTML = `
        <div class="cart-delivery-slot">
            <div class="slot-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                <span><strong>Tomorrow</strong> by 6 AM - 8 AM</span>
            </div>
            <button class="change-slot-btn">
                Change Slot
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
        </div>
        
        <div class="cart-items">
            ${state.cart.items
              .map(
                (item) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <p class="cart-item-weight">${item.weight}</p>
                        <div class="cart-item-price-row">
                            <div class="cart-item-price">
                                <span class="cart-item-current">₹${item.price * item.quantity}</span>
                                ${item.originalPrice > item.price ? `<span class="cart-item-original">₹${item.originalPrice * item.quantity}</span>` : ''}
                            </div>
                            <div class="cart-qty-control">
                                <button class="cart-qty-btn" onclick="updateCart('${item.id}', ${item.quantity - 1})">−</button>
                                <span class="cart-qty-value">${item.quantity}</span>
                                <button class="cart-qty-btn" onclick="updateCart('${item.id}', ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
        
        <div class="cart-offers">
            <h4>Offers & Benefits</h4>
            <button class="apply-coupon-btn" onclick="openCouponModal()">
                <div class="left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span>${state.cart.couponCode ? `Code ${state.cart.couponCode} applied` : 'Apply Coupon'}</span>
                </div>
                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
            <div class="wallet-option">
                <div class="left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span>FreshCatch Wallet Balance: <strong>₹${window.appData.currentUser.walletBalance || 0}</strong></span>
                </div>
                <div class="toggle-switch" onclick="this.classList.toggle('active')"></div>
            </div>
        </div>
        
        <div class="bill-summary">
            <h4>Bill summary</h4>
            <div class="bill-row">
                <span class="label">Item total</span>
                <span class="value">₹${itemTotal}</span>
            </div>
            <div class="bill-row">
                <span class="label">Delivery Fee</span>
                <span class="value">₹${deliveryFee}</span>
            </div>
            <div class="bill-row">
                <span class="label">
                    Packing Fee
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                </span>
                <span class="value">₹${packingFee}</span>
            </div>
            <div class="bill-row">
                <span class="label">GST (5%)</span>
                <span class="value">₹${gst}</span>
            </div>
            ${
              savings > 0
                ? `
                <div class="bill-row">
                    <span class="label">Savings</span>
                    <span class="value savings">- ₹${savings}</span>
                </div>
            `
                : ''
            }
            <div class="bill-total">
                <span class="label">Amount to be paid</span>
                <span class="value">₹${totalAmount}</span>
            </div>
        </div>
        
        <div class="cart-policies">
            <h4>Policies</h4>
            <ul>
                <li>Item or quantity modification is not allowed post placing an order. Verify item details before you proceed.</li>
                <li>Order cancellation shall be allowed only until items are dispatched.</li>
                <li>Refunds for cancelled orders will be processed within 3-5 business days.</li>
            </ul>
        </div>
        
        <div class="cart-footer">
            <div class="cart-address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>${window.appData.deliveryLocation.address}</span>
            </div>
            <button class="checkout-btn" onclick="proceedToCheckout()">
                Proceed to Checkout - ₹${totalAmount}
            </button>
        </div>
    `
}

function proceedToCheckout() {
  renderCheckoutPage()
  navigateTo('checkout')
}

function renderCheckoutPage() {
  const container = document.getElementById('checkout-content')
  if (!container) return

  const itemTotal = state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const deliveryOption = window.appData.deliveryOptions.find(
    (o) => o.id === state.deliveryOption,
  )
  const deliveryFee = deliveryOption?.fee || 39
  const packingFee = 10
  const gst = Math.round(itemTotal * 0.05)
  const totalAmount =
    itemTotal + deliveryFee + packingFee + gst - state.cart.couponDiscount

  container.innerHTML = `
        <div class="checkout-section">
            <h4>Delivery Address</h4>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="checkout-name" placeholder="Enter your full name" value="${window.appData.currentUser.name || ''}">
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="checkout-phone" placeholder="Enter 10-digit mobile number" value="${window.appData.currentUser.phone?.replace('+91 ', '') || ''}">
            </div>
            <div class="form-group">
                <label>Complete Address</label>
                <textarea id="checkout-address" placeholder="House no., Building name, Street, Area">${window.appData.deliveryLocation.address || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Pincode</label>
                <input type="text" id="checkout-pincode" placeholder="Enter 6-digit pincode" maxlength="6" value="${window.appData.deliveryLocation.pincode || ''}">
            </div>
        </div>
        
        <div class="checkout-section">
            <h4>Delivery Options</h4>
            <div class="delivery-options">
                ${window.appData.deliveryOptions
                  .map(
                    (opt) => `
                    <div class="delivery-option ${state.deliveryOption === opt.id ? 'selected' : ''}" onclick="selectDeliveryOption('${opt.id}')">
                        <div class="radio"></div>
                        <div class="delivery-option-info">
                            <span class="delivery-option-title">${opt.name}</span>
                            <span class="delivery-option-desc">${opt.description}</span>
                        </div>
                        <span class="delivery-option-price">₹${opt.fee}</span>
                    </div>
                `,
                  )
                  .join('')}
            </div>
        </div>
        
        <div class="checkout-section">
            <h4>Order Summary</h4>
            <div class="checkout-summary">
                <div class="checkout-summary-row">
                    <span class="label">Item total (${state.cart.items.length} items)</span>
                    <span class="value">₹${itemTotal}</span>
                </div>
                <div class="checkout-summary-row">
                    <span class="label">Delivery Fee</span>
                    <span class="value">₹${deliveryFee}</span>
                </div>
                <div class="checkout-summary-row">
                    <span class="label">Packing & Handling</span>
                    <span class="value">₹${packingFee}</span>
                </div>
                <div class="checkout-summary-row">
                    <span class="label">GST (5%)</span>
                    <span class="value">₹${gst}</span>
                </div>
                ${
                  state.cart.couponDiscount > 0
                    ? `
                    <div class="checkout-summary-row">
                        <span class="label" style="color: var(--accent);">Coupon Discount</span>
                        <span class="value" style="color: var(--accent);">- ₹${state.cart.couponDiscount}</span>
                    </div>
                `
                    : ''
                }
                <div class="checkout-summary-total">
                    <span class="label">Total Amount</span>
                    <span class="value">₹${totalAmount}</span>
                </div>
            </div>
        </div>
        
        <div class="checkout-footer">
            <button class="place-order-btn" onclick="placeOrder()">
                Place Order - ₹${totalAmount}
            </button>
        </div>
    `
}

function selectDeliveryOption(optionId) {
  state.deliveryOption = optionId
  renderCheckoutPage()
}

function placeOrder() {
  const name = document.getElementById('checkout-name')?.value
  const phone = document.getElementById('checkout-phone')?.value
  const address = document.getElementById('checkout-address')?.value
  const pincode = document.getElementById('checkout-pincode')?.value

  if (!name || !phone || !address || !pincode) {
    showToast('Please fill all required fields', 'error')
    return
  }

  if (phone.length !== 10) {
    showToast('Please enter a valid 10-digit phone number', 'error')
    return
  }

  if (pincode.length !== 6) {
    showToast('Please enter a valid 6-digit pincode', 'error')
    return
  }

  // Calculate totals
  const itemTotal = state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const deliveryOption = window.appData.deliveryOptions.find(
    (o) => o.id === state.deliveryOption,
  )
  const deliveryFee = deliveryOption?.fee || 39
  const packingFee = 10
  const gst = Math.round(itemTotal * 0.05)
  const totalAmount =
    itemTotal + deliveryFee + packingFee + gst - state.cart.couponDiscount

  // Create order
  const newOrder = {
    id: `ORD${String(window.appData.orders.length + 1).padStart(3, '0')}`,
    userId: window.appData.currentUser.id,
    customerName: name,
    customerPhone: `+91 ${phone}`,
    address: `${address}, ${pincode}`,
    items: state.cart.items.map((item) => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    })),
    itemTotal,
    deliveryFee,
    packingFee,
    gst,
    discount: state.cart.couponDiscount,
    totalAmount,
    deliverySlot: deliveryOption?.description || 'Tomorrow 6AM - 8AM',
    deliveryType: state.deliveryOption,
    status: 'pending',
    paymentMethod: 'COD',
    createdAt: new Date().toISOString(),
  }

  window.appData.orders.push(newOrder)

  // Clear cart
  state.cart = { items: [], couponCode: null, couponDiscount: 0 }
  updateCartUI()

  showToast('Order placed successfully! Order ID: ' + newOrder.id, 'success')

  // Navigate to account/orders
  setTimeout(() => {
    navigateTo('account')
    showOrders()
  }, 1500)
}

// =====================================================
// SEARCH
// =====================================================

function openSearch() {
  navigateTo('search')
}

function handleSearch(query) {
  state.searchQuery = query
  const searchProducts = document.getElementById('search-products')
  const recentSearches = document.getElementById('recent-searches')

  if (!query || query.length < 2) {
    searchProducts.style.display = 'none'
    recentSearches.style.display = 'block'
    return
  }

  recentSearches.style.display = 'none'
  searchProducts.style.display = 'grid'

  const results = window.appData.products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()),
  )

  if (results.length === 0) {
    searchProducts.innerHTML = `
            <div class="cart-empty" style="grid-column: 1/-1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                </svg>
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
            </div>
        `
  } else {
    searchProducts.innerHTML = results.map(renderProductCard).join('')
  }
}

function searchFor(query) {
  document.getElementById('search-input').value = query
  handleSearch(query)
}

function clearSearch() {
  document.getElementById('search-input').value = ''
  state.searchQuery = ''
  document.getElementById('search-products').style.display = 'none'
  document.getElementById('recent-searches').style.display = 'block'
}

// =====================================================
// ACCOUNT
// =====================================================

function showOrders() {
  const ordersSection = document.getElementById('account-orders')
  const ordersList = document.getElementById('orders-list')

  ordersSection.style.display = 'block'

  const userOrders = window.appData.orders.filter(
    (o) => o.userId === window.appData.currentUser.id || o.userId === 'guest',
  )

  if (userOrders.length === 0) {
    ordersList.innerHTML = `
            <div class="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1"/>
                </svg>
                <h3>No orders yet</h3>
                <p>Your order history will appear here</p>
            </div>
        `
  } else {
    ordersList.innerHTML = userOrders
      .map(
        (order) => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <p class="order-id">${order.id}</p>
                        <p class="order-date">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span class="order-status ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
                <div class="order-items">
                    ${order.items
                      .map(
                        (item) => `
                        <div class="order-item">
                            <img src="${item.image}" alt="${item.name}" class="order-item-image">
                            <div class="order-item-info">
                                <p class="order-item-name">${item.name}</p>
                                <p class="order-item-qty">Qty: ${item.quantity} × ₹${item.price}</p>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
                <div class="order-total">
                    <span>Total Amount</span>
                    <span>₹${order.totalAmount}</span>
                </div>
            </div>
        `,
      )
      .join('')
  }
}

function showAddresses() {
  showToast('Address management coming soon!', 'warning')
}

function showWallet() {
  showToast('Wallet feature coming soon!', 'warning')
}

function showSupport() {
  showToast('Contact us at support@freshcatch.com', 'success')
}

// =====================================================
// MODALS
// =====================================================

function openLocationModal() {
  document.getElementById('location-modal').classList.add('active')
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active')
}

function useCurrentLocation() {
  showToast('Using current location...', 'success')
  setTimeout(() => {
    window.appData.deliveryLocation = {
      address: 'Mumbai, 400001',
      pincode: '400001',
      city: 'Mumbai',
    }
    document.getElementById('delivery-address').textContent =
      window.appData.deliveryLocation.address
    closeModal('location-modal')
  }, 1000)
}

function setLocation() {
  const pincode = document.getElementById('pincode-input').value
  if (pincode.length !== 6) {
    showToast('Please enter a valid 6-digit pincode', 'error')
    return
  }

  window.appData.deliveryLocation = {
    address: `Pincode ${pincode}`,
    pincode: pincode,
    city: 'India',
  }
  document.getElementById('delivery-address').textContent =
    window.appData.deliveryLocation.address
  closeModal('location-modal')
  showToast('Delivery location updated!', 'success')
}

function openCouponModal() {
  const couponCode = prompt('Enter coupon code:')
  if (couponCode) {
    applyCoupon(couponCode.toUpperCase())
  }
}

function applyCoupon(code) {
  const coupon = window.appData.coupons.find((c) => c.code === code)
  const itemTotal = state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  if (!coupon) {
    showToast('Invalid coupon code', 'error')
    return
  }

  if (itemTotal < coupon.minOrder) {
    showToast(
      `Minimum order ₹${coupon.minOrder} required for this coupon`,
      'error',
    )
    return
  }

  let discount = 0
  if (coupon.type === 'percentage') {
    discount = Math.min((itemTotal * coupon.discount) / 100, coupon.maxDiscount)
  } else {
    discount = coupon.discount
  }

  state.cart.couponCode = code
  state.cart.couponDiscount = Math.round(discount)

  showToast(
    `Coupon applied! You saved ₹${state.cart.couponDiscount}`,
    'success',
  )
  renderCartPage()
}

function applyOffer(code) {
  if (state.cart.items.length === 0) {
    showToast('Add items to cart first to apply offer', 'warning')
    return
  }
  applyCoupon(code)
}

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container')
  const toast = document.createElement('div')
  toast.className = `toast ${type}`

  const icons = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  }

  toast.innerHTML = `${icons[type]}<span>${message}</span>`
  container.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// =====================================================
// LOGIN/AUTH
// =====================================================

function openLoginModal() {
  document.getElementById('login-modal').classList.add('active')
}

function sendOTP() {
  const phone = document.getElementById('phone-input').value
  if (phone.length !== 10) {
    showToast('Please enter a valid 10-digit phone number', 'error')
    return
  }

  document.getElementById('otp-phone').textContent = `+91 ${phone}`
  closeModal('login-modal')
  document.getElementById('otp-modal').classList.add('active')

  // Start resend timer
  let timer = 30
  const resendBtn = document.getElementById('resend-btn')
  resendBtn.disabled = true
  const interval = setInterval(() => {
    timer--
    resendBtn.textContent = `Resend in 00:${timer.toString().padStart(2, '0')}`
    if (timer <= 0) {
      clearInterval(interval)
      resendBtn.disabled = false
      resendBtn.textContent = 'Resend OTP'
    }
  }, 1000)
}

function moveToNext(input, index) {
  if (input.value.length === 1 && index < 5) {
    const inputs = document.querySelectorAll('.otp-input')
    inputs[index]?.focus()
  }
}

function resendOTP() {
  showToast('OTP sent again!', 'success')
  // Restart timer
  let timer = 30
  const resendBtn = document.getElementById('resend-btn')
  resendBtn.disabled = true
  const interval = setInterval(() => {
    timer--
    resendBtn.textContent = `Resend in 00:${timer.toString().padStart(2, '0')}`
    if (timer <= 0) {
      clearInterval(interval)
      resendBtn.disabled = false
      resendBtn.textContent = 'Resend OTP'
    }
  }, 1000)
}

function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input')
  const otp = Array.from(inputs)
    .map((i) => i.value)
    .join('')

  if (otp.length !== 5) {
    showToast('Please enter complete OTP', 'error')
    return
  }

  // Demo: Accept any OTP
  window.appData.currentUser = {
    id: 'u1',
    name: 'Rahul Sharma',
    phone: document.getElementById('otp-phone').textContent,
    isLoggedIn: true,
  }

  document.getElementById('account-name').textContent =
    window.appData.currentUser.name
  document.getElementById('account-phone').textContent =
    window.appData.currentUser.phone

  closeModal('otp-modal')
  showToast('Login successful!', 'success')
}

// =====================================================
// FILTER
// =====================================================

function openFilters() {
  showToast('Filters coming soon!', 'warning')
}

// =====================================================
// ADMIN PANEL
// =====================================================

function openAdminPanel() {
  document.getElementById('admin-panel').style.display = 'flex'
  showAdminSection('dashboard')
}

function closeAdminPanel() {
  document.getElementById('admin-panel').style.display = 'none'
}

function showAdminSection(section) {
  // Update nav
  document.querySelectorAll('.admin-nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section)
  })

  // Update title
  const titles = {
    dashboard: 'Dashboard',
    products: 'Products Management',
    orders: 'Orders Management',
    categories: 'Categories Management',
    hero: 'Hero Banners',
    reports: 'Reports & Analytics',
    users: 'User Management',
  }
  document.getElementById('admin-page-title').textContent = titles[section]

  // Render content
  const content = document.getElementById('admin-content')

  switch (section) {
    case 'dashboard':
      renderAdminDashboard(content)
      break
    case 'products':
      renderAdminProducts(content)
      break
    case 'orders':
      renderAdminOrders(content)
      break
    case 'categories':
      renderAdminCategories(content)
      break
    case 'hero':
      renderAdminHero(content)
      break
    case 'reports':
      renderAdminReports(content)
      break
    case 'users':
      renderAdminUsers(content)
      break
  }
}

function renderAdminDashboard(container) {
  const data = window.appData.reportsData

  container.innerHTML = `
        <div class="admin-stats">
            <div class="stat-card">
                <p class="label">Total Revenue</p>
                <p class="value">₹${data.totalRevenue.toLocaleString()}</p>
                <p class="change positive">+${data.revenueGrowth}% from last month</p>
            </div>
            <div class="stat-card">
                <p class="label">Total Orders</p>
                <p class="value">${data.totalOrders}</p>
                <p class="change positive">+${data.orderGrowth}% from last month</p>
            </div>
            <div class="stat-card">
                <p class="label">Total Customers</p>
                <p class="value">${data.totalCustomers}</p>
                <p class="change positive">+${data.customerGrowth}% from last month</p>
            </div>
            <div class="stat-card">
                <p class="label">Avg. Order Value</p>
                <p class="value">₹${data.averageOrderValue}</p>
                <p class="change positive">+5.2% from last month</p>
            </div>
        </div>
        
        <div class="admin-grid">
            <div class="admin-card">
                <div class="admin-card-header">
                    <h4>Revenue Overview</h4>
                </div>
                <div class="admin-card-body">
                    <div class="chart-placeholder">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px;">
                                <line x1="18" y1="20" x2="18" y2="10"/>
                                <line x1="12" y1="20" x2="12" y2="4"/>
                                <line x1="6" y1="20" x2="6" y2="14"/>
                            </svg>
                            <span>Revenue Chart - ${data.dailyRevenue.map((d) => `₹${(d.revenue / 1000).toFixed(1)}K`).join(' | ')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h4>Recent Orders</h4>
                </div>
                <div class="admin-card-body">
                    <div class="recent-orders-list">
                        ${window.appData.orders
                          .slice(0, 5)
                          .map(
                            (order) => `
                            <div class="recent-order-item">
                                <div class="order-info">
                                    <p class="order-id">${order.id}</p>
                                    <p class="order-customer">${order.customerName}</p>
                                </div>
                                <span class="order-status ${order.status}" style="margin-right: 8px;">${order.status}</span>
                                <span class="order-amount">₹${order.totalAmount}</span>
                            </div>
                        `,
                          )
                          .join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="admin-card" style="margin-top: 24px;">
            <div class="admin-card-header">
                <h4>Top Selling Products</h4>
            </div>
            <div class="admin-card-body" style="padding: 0;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Units Sold</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.topProducts
                          .map((p) => {
                            const product = window.appData.products.find(
                              (prod) => prod.id === p.id,
                            )
                            return `
                                <tr>
                                    <td>
                                        <div class="product-cell">
                                            <img src="${product?.images[0] || ''}" class="product-image" alt="">
                                            <span>${p.name}</span>
                                        </div>
                                    </td>
                                    <td>${p.sales}</td>
                                    <td>₹${p.revenue.toLocaleString()}</td>
                                </tr>
                            `
                          })
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `
}

function renderAdminProducts(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <h4>All Products (${window.appData.products.length})</h4>
                <button class="btn btn-primary" style="width: auto; padding: 8px 16px;" onclick="showAddProductForm()">
                    + Add Product
                </button>
            </div>
            <div class="admin-card-body" style="padding: 0;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${window.appData.products
                          .map(
                            (p) => `
                            <tr>
                                <td>
                                    <div class="product-cell">
                                        <img src="${p.images[0]}" class="product-image" alt="${p.name}">
                                        <span>${p.name}</span>
                                    </div>
                                </td>
                                <td>${p.category}</td>
                                <td>₹${p.price}</td>
                                <td>${p.stockQty}</td>
                                <td>
                                    <span class="status ${p.inStock ? (p.stockQty < 10 ? 'low-stock' : 'in-stock') : 'out-of-stock'}">
                                        ${p.inStock ? (p.stockQty < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
                                    </span>
                                </td>
                                <td>
                                    <div class="admin-actions">
                                        <button class="admin-action-btn edit" onclick="editProduct('${p.id}')">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </button>
                                        <button class="admin-action-btn delete" onclick="toggleProductStock('${p.id}')">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                ${p.inStock ? '<path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>' : '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'}
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `,
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `
}

function renderAdminOrders(container) {
  const pendingOrders = window.appData.orders.filter(
    (o) => o.status === 'pending',
  )
  const confirmedOrders = window.appData.orders.filter(
    (o) => o.status === 'confirmed',
  )
  const allOrders = window.appData.orders

  container.innerHTML = `
        <div class="admin-stats" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
            <div class="stat-card">
                <p class="label">Pending Orders</p>
                <p class="value" style="color: var(--warning);">${pendingOrders.length}</p>
            </div>
            <div class="stat-card">
                <p class="label">Confirmed Orders</p>
                <p class="value" style="color: var(--primary);">${confirmedOrders.length}</p>
            </div>
            <div class="stat-card">
                <p class="label">Delivered</p>
                <p class="value" style="color: var(--accent);">${window.appData.orders.filter((o) => o.status === 'delivered').length}</p>
            </div>
            <div class="stat-card">
                <p class="label">Cancelled</p>
                <p class="value" style="color: var(--error);">${window.appData.orders.filter((o) => o.status === 'cancelled').length}</p>
            </div>
        </div>
        
        <div class="admin-card">
            <div class="admin-card-header">
                <h4>All Orders (${allOrders.length})</h4>
            </div>
            <div class="admin-card-body" style="padding: 0;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allOrders
                          .map(
                            (order) => `
                            <tr>
                                <td><strong>${order.id}</strong></td>
                                <td>
                                    <div>
                                        <p style="font-weight: 500;">${order.customerName}</p>
                                        <p style="font-size: 12px; color: var(--text-muted);">${order.customerPhone}</p>
                                    </div>
                                </td>
                                <td>${order.items.length} items</td>
                                <td>₹${order.totalAmount}</td>
                                <td>
                                    <span class="status ${order.status === 'pending' ? 'low-stock' : order.status === 'confirmed' ? 'in-stock' : order.status === 'delivered' ? 'in-stock' : 'out-of-stock'}">
                                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </td>
                                <td>${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                <td>
                                    <div class="admin-actions">
                                        <button class="admin-action-btn" onclick="viewOrderDetails('${order.id}')">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </button>
                                        ${
                                          order.status === 'pending'
                                            ? `
                                            <button class="admin-action-btn edit" onclick="confirmOrder('${order.id}')">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M20 6L9 17l-5-5"/>
                                                </svg>
                                            </button>
                                        `
                                            : ''
                                        }
                                    </div>
                                </td>
                            </tr>
                        `,
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `
}

function renderAdminCategories(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <h4>All Categories (${window.appData.categories.length})</h4>
                <button class="btn btn-primary" style="width: auto; padding: 8px 16px;">
                    + Add Category
                </button>
            </div>
            <div class="admin-card-body" style="padding: 0;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Subcategories</th>
                            <th>Products</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${window.appData.categories
                          .map((cat) => {
                            const productCount = window.appData.products.filter(
                              (p) => p.category === cat.id,
                            ).length
                            return `
                                <tr>
                                    <td>
                                        <div class="product-cell">
                                            <img src="${cat.image}" class="product-image" alt="${cat.name}">
                                            <span>${cat.name}</span>
                                        </div>
                                    </td>
                                    <td>${cat.description}</td>
                                    <td>${cat.subcategories.length}</td>
                                    <td>${productCount}</td>
                                    <td>
                                        <div class="admin-actions">
                                            <button class="admin-action-btn edit">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `
                          })
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `
}

function renderAdminHero(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <h4>Hero Banners (${window.appData.heroBanners.length})</h4>
                <button class="btn btn-primary" style="width: auto; padding: 8px 16px;">
                    + Add Banner
                </button>
            </div>
            <div class="admin-card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${window.appData.heroBanners
                      .map(
                        (banner) => `
                        <div style="border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
                            <div style="position: relative; height: 150px;">
                                <img src="${banner.image}" style="width: 100%; height: 100%; object-fit: cover;">
                                <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding: 16px; display: flex; flex-direction: column; justify-content: flex-end; color: white;">
                                    <span style="font-size: 10px; background: var(--primary); padding: 2px 8px; border-radius: 10px; width: fit-content; margin-bottom: 4px;">${banner.badge}</span>
                                    <h4 style="font-size: 16px; font-weight: 700;">${banner.title}</h4>
                                    <p style="font-size: 12px; opacity: 0.9;">${banner.subtitle}</p>
                                </div>
                            </div>
                            <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <p style="font-size: 12px; color: var(--text-muted);">Links to: ${banner.linkType} - ${banner.linkId}</p>
                                </div>
                                <div class="admin-actions">
                                    <button class="admin-action-btn edit">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                    <button class="admin-action-btn delete">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3,6 5,6 21,6"/>
                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
    `
}

function renderAdminReports(container) {
  const data = window.appData.reportsData

  container.innerHTML = `
        <div class="admin-stats">
            <div class="stat-card">
                <p class="label">Total Revenue</p>
                <p class="value">₹${data.totalRevenue.toLocaleString()}</p>
                <p class="change positive">+${data.revenueGrowth}%</p>
            </div>
            <div class="stat-card">
                <p class="label">Total Orders</p>
                <p class="value">${data.totalOrders}</p>
                <p class="change positive">+${data.orderGrowth}%</p>
            </div>
            <div class="stat-card">
                <p class="label">Customers</p>
                <p class="value">${data.totalCustomers}</p>
                <p class="change positive">+${data.customerGrowth}%</p>
            </div>
            <div class="stat-card">
                <p class="label">Avg. Order Value</p>
                <p class="value">₹${data.averageOrderValue}</p>
                <p class="change positive">+5.2%</p>
            </div>
        </div>
        
        <div class="admin-grid" style="margin-top: 24px;">
            <div class="admin-card">
                <div class="admin-card-header">
                    <h4>Sales Overview (Last 7 Days)</h4>
                </div>
                <div class="admin-card-body">
                    <div class="chart-placeholder" style="height: 300px;">
                        <div style="width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: space-around; padding: 20px;">
                            ${data.dailyRevenue
                              .map(
                                (d) => `
                                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                    <div style="width: 40px; background: var(--primary); border-radius: 4px 4px 0 0; height: ${(d.revenue / 30000) * 200}px;"></div>
                                    <span style="font-size: 10px; color: var(--text-muted);">${new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            `,
                              )
                              .join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h4>Orders by Status</h4>
                </div>
                <div class="admin-card-body">
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Pending</span>
                            <div style="flex: 1; margin: 0 16px; height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${(data.ordersByStatus.pending / data.totalOrders) * 100}%; height: 100%; background: var(--warning);"></div>
                            </div>
                            <span style="font-weight: 600;">${data.ordersByStatus.pending}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Confirmed</span>
                            <div style="flex: 1; margin: 0 16px; height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${(data.ordersByStatus.confirmed / data.totalOrders) * 100}%; height: 100%; background: var(--primary);"></div>
                            </div>
                            <span style="font-weight: 600;">${data.ordersByStatus.confirmed}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Delivered</span>
                            <div style="flex: 1; margin: 0 16px; height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${(data.ordersByStatus.delivered / data.totalOrders) * 100}%; height: 100%; background: var(--accent);"></div>
                            </div>
                            <span style="font-weight: 600;">${data.ordersByStatus.delivered}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Cancelled</span>
                            <div style="flex: 1; margin: 0 16px; height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${(data.ordersByStatus.cancelled / data.totalOrders) * 100}%; height: 100%; background: var(--error);"></div>
                            </div>
                            <span style="font-weight: 600;">${data.ordersByStatus.cancelled}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

function renderAdminUsers(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <h4>All Users (${window.appData.users.length})</h4>
            </div>
            <div class="admin-card-body" style="padding: 0;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Wallet Balance</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${window.appData.users
                          .map(
                            (user) => `
                            <tr>
                                <td><strong>${user.name}</strong></td>
                                <td>${user.phone}</td>
                                <td>${user.email}</td>
                                <td>₹${user.walletBalance}</td>
                                <td>${new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td>
                                    <div class="admin-actions">
                                        <button class="admin-action-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `,
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `
}

// Admin Actions
function editProduct(productId) {
  showToast('Product editor opening...', 'warning')
}

function toggleProductStock(productId) {
  const product = window.appData.products.find((p) => p.id === productId)
  if (product) {
    product.inStock = !product.inStock
    product.stockQty = product.inStock ? 10 : 0
    showToast(
      `${product.name} is now ${product.inStock ? 'in stock' : 'out of stock'}`,
      'success',
    )
    renderAdminProducts(document.getElementById('admin-content'))
    refreshProductCards()
  }
}

function confirmOrder(orderId) {
  const order = window.appData.orders.find((o) => o.id === orderId)
  if (order) {
    order.status = 'confirmed'
    order.confirmedAt = new Date().toISOString()
    showToast(`Order ${orderId} confirmed!`, 'success')
    renderAdminOrders(document.getElementById('admin-content'))
  }
}

function viewOrderDetails(orderId) {
  const order = window.appData.orders.find((o) => o.id === orderId)
  if (order) {
    alert(
      `Order Details:\n\nID: ${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nAddress: ${order.address}\n\nItems:\n${order.items.map((i) => `- ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join('\n')}\n\nTotal: ₹${order.totalAmount}\nStatus: ${order.status}`,
    )
  }
}

function showAddProductForm() {
  showToast('Add product form coming soon!', 'warning')
}

// Initialize
console.log('FreshCatch App Loaded!')
