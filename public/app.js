// =====================================================
// The Fish Merchant - SEAFOOD QUICK COMMERCE APPLICATION
// =====================================================

// ─── CONFIG ──────────────────────────────────────────────────────
const WHATSAPP_NUMBER = '919054217787' // Change to your number
const API_BASE = '/api' // Backend URL (same origin when deployed)

// ─── Admin Auth State ────────────────────────────────────────────
let adminToken = localStorage.getItem('fc_admin_token') || null

// ─── API Helper ──────────────────────────────────────────────────
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'API error')
  return data
}

// =====================================================
// GPS / REAL-TIME LOCATION
// =====================================================

function requestGPSLocation(onSuccess) {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error')
    return
  }
  showToast('Fetching your location...', 'success')
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      try {
        // Free reverse-geocode via OpenStreetMap Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } },
        )
        const data = await res.json()
        const a = data.address || {}

        // Build a human-readable address from the parts that exist
        const parts = [
          a.house_number,
          a.road || a.pedestrian || a.footway,
          a.neighbourhood || a.suburb,
          a.city || a.town || a.village || a.county,
          a.state,
        ].filter(Boolean)

        const address = parts.join(', ')
        const pincode = a.postcode || ''
        const city = a.city || a.town || a.village || a.county || 'India'

        // Save to app state so cart footer updates too
        window.appData.deliveryLocation = {
          address,
          pincode,
          city,
          latitude,
          longitude,
        }
        const display = city + (pincode ? `, ${pincode}` : '')
        const headerEl = document.getElementById('delivery-address')
        if (headerEl) headerEl.textContent = display

        showToast('Location detected!', 'success')
        if (typeof onSuccess === 'function') onSuccess({ address, pincode })
      } catch (e) {
        showToast('Could not read address. Please enter manually.', 'error')
      }
    },
    (err) => {
      const msgs = {
        1: 'Location permission denied. Please allow access in your browser settings.',
        2: 'Location unavailable. Please enter address manually.',
        3: 'Location request timed out. Please try again.',
      }
      showToast(
        msgs[err.code] || 'Location error. Please enter manually.',
        'error',
      )
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  )
}

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
  adminLoggedIn: !!adminToken,
}

async function loadLiveData() {
  try {
    const [prodRes, catRes] = await Promise.all([
      api('/products'),
      api('/categories'),
    ])

    if (prodRes.success && prodRes.data.length) {
      window.appData.products = prodRes.data.map((p) => ({ ...p, id: p._id }))
    }

    if (catRes.success && catRes.data.length) {
      window.appData.categories = catRes.data
    }

    renderHomeCategories()
    renderCurrentHits()
    renderFishProducts()
    renderPrawnsProducts()
    renderReadyToCookProducts()
    renderAllCategories()
  } catch (e) {
    console.warn('Backend offline, using local data:', e.message)
  }
}

async function loadLiveSettings() {
  try {
    const res = await api('/settings')
    if (!res.success) return

    const s = res.data

    window.appData.deliveryOptions = [
      {
        id: 'standard',
        name: 'Standard Delivery',
        description: 'Tomorrow 6AM - 8AM',
        fee: s.standardDeliveryFee,
      },
      {
        id: 'express',
        name: 'Express Delivery',
        description: 'Get it in 30-60 minutes',
        fee: s.expressDeliveryFee,
      },
      {
        id: 'scheduled',
        name: 'Scheduled Delivery',
        description: 'Choose your slot',
        fee: s.scheduledDeliveryFee,
      },
    ]

    window.appData.freeDeliveryThreshold = s.freeDeliveryThreshold || 0
    window.appData.storeOpen = s.storeOpen !== false
  } catch (e) {
    console.warn('Settings load failed:', e.message)
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initApp()
})

async function initApp() {
  state.cart = window.appData.cart

  // Render with local data immediately (instant load)
  renderHomeCategories()
  renderCurrentHits()
  renderFishProducts()
  renderPrawnsProducts()
  renderReadyToCookProducts()
  renderAllCategories()
  initHeroSlider()
  updateCartUI()

  const dateEl = document.getElementById('admin-date')
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) showPage(e.state.page, false)
  })
  history.pushState({ page: 'home' }, '', '#home')

  // Silently fetch live data from backend in background
  loadLiveData()
  initCustomerAuth()
  loadLiveSettings()
  loadLiveBanners()

  // Auto-request GPS location silently
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } },
          )
          const data = await res.json()
          const a = data.address || {}
          const city = a.city || a.town || a.village || a.county || ''
          const pincode = a.postcode || ''
          const parts = [a.neighbourhood || a.suburb, city, pincode].filter(
            Boolean,
          )
          const display = parts.join(', ')
          window.appData.deliveryLocation = {
            address: display,
            pincode,
            city,
            fromGPS: true,
          }
          const el = document.getElementById('delivery-address')
          if (el && display) el.textContent = display
        } catch (e) {}
      },
      () => {}, // silent fail
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  }
}

// =====================================================
// NAVIGATION
// =====================================================

function navigateTo(page, data = null) {
  state.previousPages.push(state.currentPage)
  showPage(page, true, data)
}

// Pages where the floating cart button must be hidden
const HIDE_CART_BTN_PAGES = ['cart', 'checkout']

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

  // Hide floating cart on cart & checkout so it never covers action buttons
  const floatingCart = document.getElementById('floating-cart')
  if (floatingCart) {
    const totalItems = state.cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    )
    const shouldShow = totalItems > 0 && !HIDE_CART_BTN_PAGES.includes(page)
    floatingCart.style.display = shouldShow ? 'flex' : 'none'
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

  // Update floating cart — hide on cart/checkout pages so it never blocks action buttons
  const floatingCart = document.getElementById('floating-cart')
  if (floatingCart) {
    const onBlockedPage = HIDE_CART_BTN_PAGES.includes(state.currentPage)
    floatingCart.style.display =
      totalItems > 0 && !onBlockedPage ? 'flex' : 'none'
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
  const savings = originalTotal - itemTotal + state.cart.couponDiscount
  const totalAmount = itemTotal + deliveryFee - state.cart.couponDiscount

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
                    <span>The Fish Merchant Wallet Balance: <strong>₹${window.appData.currentUser.walletBalance || 0}</strong></span>
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
                <span class="value">${deliveryFee === 0 ? '<span style="color:var(--accent)">Free</span>' : '₹' + deliveryFee}</span>
            </div>
            ${
              state.cart.couponDiscount > 0
                ? `
                <div class="bill-row">
                    <span class="label">Coupon (${state.cart.couponCode})</span>
                    <span class="value savings">- ₹${state.cart.couponDiscount}</span>
                </div>
            `
                : ''
            }
            ${
              savings > 0
                ? `
                <div class="bill-row">
                    <span class="label">You save</span>
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
    (sum, i) => sum + i.price * i.quantity,
    0,
  )
  // Delivery fee shown as "calculated by admin on confirmation"
  const threshold = window.appData.freeDeliveryThreshold || 0
  const deliveryFee =
    threshold > 0 && itemTotal >= threshold
      ? 0
      : window.appData.deliveryOptions?.[0]?.fee || 39
  const totalAmount = itemTotal + deliveryFee - state.cart.couponDiscount

  const savedAddress = window.appData.deliveryLocation?.fromGPS
    ? window.appData.deliveryLocation.address
    : ''
  const savedPincode = window.appData.deliveryLocation?.fromGPS
    ? window.appData.deliveryLocation.pincode || ''
    : ''

  // Pre-fill from logged-in customer
  const custName =
    currentCustomer?.name || window.appData.currentUser?.name || ''
  const custPhone =
    currentCustomer?.phone?.slice(-10) ||
    window.appData.currentUser?.phone?.replace('+91 ', '') ||
    ''

  container.innerHTML = `
        <div class="checkout-section">
            <h4>Delivery Address</h4>
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" id="checkout-name" placeholder="Enter your full name" value="${custName}">
            </div>
            <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" id="checkout-phone" placeholder="10-digit mobile number" maxlength="10" value="${custPhone}">
            </div>
            <div class="form-group">
                <label>Delivery Address *</label>
                <button type="button" onclick="fillAddressFromGPS()" style="display:flex;align-items:center;gap:6px;width:100%;padding:10px 14px;margin-bottom:8px;border:1.5px dashed var(--primary);border-radius:8px;background:var(--primary-light);color:var(--primary);font-size:14px;font-weight:500;cursor:pointer;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
                    Use my current location
                </button>
                <textarea id="checkout-address" placeholder="House no., Building, Street, Area">${savedAddress}</textarea>
            </div>
            <div class="form-group">
                <label>Pincode *</label>
                <input type="text" id="checkout-pincode" placeholder="6-digit pincode" maxlength="6" value="${savedPincode}">
            </div>
            <div class="form-group">
                <label>Landmark (optional)</label>
                <input type="text" id="checkout-landmark" placeholder="Near temple, next to park...">
            </div>
        </div>

        <div class="checkout-section">
            <h4>Order Summary</h4>
            <div class="checkout-summary">
                <div class="checkout-summary-row">
                    <span class="label">Items (${state.cart.items.length})</span>
                    <span class="value">₹${itemTotal}</span>
                </div>
                <div class="checkout-summary-row">
                    <span class="label">Delivery</span>
                    <span class="value" style="color:var(--text-muted);font-size:12px;">${deliveryFee === 0 ? '🎉 Free' : '₹' + deliveryFee + ' (estimated)'}</span>
                </div>
                ${
                  state.cart.couponDiscount > 0
                    ? `
                <div class="checkout-summary-row">
                    <span class="label" style="color:var(--accent);">Coupon (${state.cart.couponCode})</span>
                    <span class="value" style="color:var(--accent);">−₹${state.cart.couponDiscount}</span>
                </div>`
                    : ''
                }
                <div class="checkout-summary-total">
                    <span class="label">Estimated Total</span>
                    <span class="value">₹${totalAmount}</span>
                </div>
            </div>
        </div>

        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px;margin-bottom:16px;">
            <p style="font-size:13px;color:#1E40AF;margin:0;line-height:1.6;">
                📲 After placing your order, our team will confirm it on <strong>WhatsApp</strong> with the exact delivery charge based on your location.
            </p>
        </div>

        <div class="checkout-footer">
            <button class="place-order-btn" onclick="sendOrderToWhatsApp()" style="background:#25D366;display:flex;align-items:center;justify-content:center;gap:10px;">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width:22px;height:22px;flex-shrink:0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Place Order on WhatsApp
            </button>
        </div>`
}

// Called by the "Use my current location" button inside checkout
function fillAddressFromGPS() {
  requestGPSLocation(({ address, pincode }) => {
    const addrEl = document.getElementById('checkout-address')
    const pinEl = document.getElementById('checkout-pincode')
    if (addrEl) addrEl.value = address
    if (pinEl && pincode) pinEl.value = pincode
  })
}

function sendOrderToWhatsApp() {
  const name = document.getElementById('checkout-name')?.value.trim()
  const phone = document.getElementById('checkout-phone')?.value.trim()
  const address = document.getElementById('checkout-address')?.value.trim()
  const pincode = document.getElementById('checkout-pincode')?.value.trim()
  const landmark = document.getElementById('checkout-landmark')?.value.trim()

  // Validation
  if (!name || !phone || !address || !pincode) {
    showToast('Please fill all required fields', 'error')
    return
  }
  if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'error')
    return
  }
  if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    showToast('Please enter a valid 6-digit pincode', 'error')
    return
  }

  // Totals — no hidden fees, just items + delivery
  const itemTotal = state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const deliveryOption = window.appData.deliveryOptions.find(
    (o) => o.id === state.deliveryOption,
  )
  const deliveryFee = deliveryOption?.fee || 39
  const totalAmount = itemTotal + deliveryFee - state.cart.couponDiscount

  // Save to backend (don't block WhatsApp opening if this fails)
  api('/orders', {
    method: 'POST',
    body: JSON.stringify({
      customerName: name,
      customerPhone: '+91 ' + phone,
      address,
      landmark,
      pincode,
      city: window.appData.deliveryLocation?.city || '',
      items: state.cart.items.map((item) => ({
        productId: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        weight: item.weight,
        image: item.image,
      })),
      itemTotal,
      deliveryFee,
      discount: state.cart.couponDiscount,
      couponCode: state.cart.couponCode || '',
      totalAmount,
      deliveryType: state.deliveryOption,
      deliverySlot: deliveryOption?.description || 'Tomorrow 6AM - 8AM',
      paymentMethod: 'COD',
    }),
  }).catch((err) => console.warn('Order save to backend failed:', err.message))

  // Build the WhatsApp message
  const orderId = `ORD${Date.now().toString().slice(-6)}`

  const itemLines = state.cart.items
    .map(
      (item) =>
        `  • ${item.name} × ${item.quantity}  →  ₹${item.price * item.quantity}`,
    )
    .join('\n')

  const addressLine = [
    address,
    landmark ? `Near: ${landmark}` : '',
    `Pincode: ${pincode}`,
  ]
    .filter(Boolean)
    .join(', ')

  const message = [
    `🐟 *The Fish Merchant – New Order*`,
    `Order ID: *${orderId}*`,
    ``,
    `👤 *Customer Details*`,
    `Name: ${name}`,
    `Phone: +91 ${phone}`,
    ``,
    `📦 *Order Items*`,
    itemLines,
    ``,
    `💰 *Bill Summary*`,
    `Item Total:    ₹${itemTotal}`,
    `Delivery Fee:  ₹${deliveryFee}`,
    state.cart.couponDiscount > 0
      ? `Coupon (${state.cart.couponCode}): -₹${state.cart.couponDiscount}`
      : null,
    `*Total Amount: ₹${totalAmount}*`,
    ``,
    `📍 *Delivery Address*`,
    addressLine,
    ``,
    `🚚 *Delivery Slot*`,
    deliveryOption?.description || 'Tomorrow 6AM – 8AM',
    ``,
    `Payment: Cash on Delivery`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  // Encode and open WhatsApp
  const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  window.open(waURL, '_blank')

  // Save order locally and clear cart
  const newOrder = {
    id: orderId,
    userId: window.appData.currentUser.id || 'guest',
    customerName: name,
    customerPhone: `+91 ${phone}`,
    address: addressLine,
    items: state.cart.items.map((item) => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    })),
    itemTotal,
    deliveryFee,
    discount: state.cart.couponDiscount,
    totalAmount,
    deliverySlot: deliveryOption?.description || 'Tomorrow 6AM – 8AM',
    deliveryType: state.deliveryOption,
    status: 'pending',
    paymentMethod: 'COD',
    createdAt: new Date().toISOString(),
  }
  window.appData.orders.push(newOrder)

  // Clear cart
  state.cart = { items: [], couponCode: null, couponDiscount: 0 }
  updateCartUI()

  showToast('Opening WhatsApp with your order! 🎉', 'success')

  // Navigate to account/orders after a brief delay
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

async function showOrders() {
  const ordersSection = document.getElementById('account-orders')
  const ordersList = document.getElementById('orders-list')
  if (!ordersSection || !ordersList) return
  ordersSection.style.display = 'block'
  ordersList.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-muted);">Loading your orders...</div>`

  try {
    const headers = {}
    if (customerToken) headers['Authorization'] = `Bearer ${customerToken}`
    const qs =
      !customerToken && currentCustomer?.phone
        ? `?phone=${currentCustomer.phone}`
        : ''
    const res = await fetch(`${API_BASE}/orders/mine${qs}`, { headers })
    const data = await res.json()

    if (!data.success || !data.data.length) {
      ordersList.innerHTML = `
                <div class="cart-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:48px;height:48px;color:var(--text-muted);"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
                    <h3>No orders yet</h3>
                    <p>Your order history will appear here</p>
                    ${!customerToken ? `<p style="font-size:13px;color:var(--primary);margin-top:8px;">Login to see your orders</p>` : ''}
                </div>`
      return
    }

    ordersList.innerHTML = data.data
      .map(
        (order) => `
            <div class="order-card" id="order-cust-${order._id}">
                <div class="order-header">
                    <div>
                        <p class="order-id">${order.orderId}</p>
                        <p class="order-date">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    ${customerOrderBadge(order.status)}
                </div>
                <div class="order-items">
                    ${order.items
                      .slice(0, 3)
                      .map(
                        (item) => `
                        <div class="order-item">
                            <img src="${item.image || ''}" alt="${item.name}" class="order-item-image" onerror="this.style.display='none'">
                            <div class="order-item-info">
                                <p class="order-item-name">${item.name}</p>
                                <p class="order-item-qty">Qty: ${item.quantity} × ₹${item.price}</p>
                            </div>
                        </div>`,
                      )
                      .join('')}
                    ${order.items.length > 3 ? `<p style="font-size:12px;color:var(--text-muted);padding:4px 0;">+${order.items.length - 3} more items</p>` : ''}
                </div>
                <div class="order-total">
                    <span>Total</span>
                    <span>₹${order.totalAmount}</span>
                </div>
                ${['delivered', 'out_for_delivery', 'cancelled'].includes(order.status) ? '' : ''}
                <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button onclick="showCustomerOrderDetail('${order._id}')"
                        style="flex:1;padding:9px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-weight:600;background:white;cursor:pointer;">
                        View Details
                    </button>
                    ${
                      order.status === 'delivered'
                        ? `
                    <button onclick="showRaiseIssueModal('${order._id}','${order.orderId}')"
                        style="flex:1;padding:9px;border:1.5px solid var(--error);border-radius:8px;font-size:13px;font-weight:600;color:var(--error);background:white;cursor:pointer;">
                        Report Issue
                    </button>`
                        : ''
                    }
                </div>
            </div>`,
      )
      .join('')
  } catch (err) {
    ordersList.innerHTML = `<div style="padding:20px;color:var(--error);">Could not load orders: ${err.message}</div>`
  }
}

function customerOrderBadge(status) {
  const map = {
    pending: ['#FEF3C7', '#92400E', '⏳ Pending'],
    confirmed: ['#DBEAFE', '#1E40AF', '✅ Confirmed'],
    preparing: ['#EDE9FE', '#5B21B6', '🔪 Preparing'],
    out_for_delivery: ['#FEE2E2', '#991B1B', '🚚 On the Way'],
    delivered: ['#D1FAE5', '#065F46', '✅ Delivered'],
    cancelled: ['#FEE2E2', '#991B1B', '❌ Cancelled'],
  }
  const [bg, col, label] = map[status] || ['#F3F4F6', '#374151', status]
  return `<span class="order-status" style="background:${bg};color:${col};padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;">${label}</span>`
}

function showCustomerOrderDetail(orderId) {
  fetch(`${API_BASE}/orders/${orderId}`)
    .then((r) => r.json())
    .then((res) => {
      const o = res.data
      const modal = document.createElement('div')
      modal.className = 'modal active'
      modal.innerHTML = `
                <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
                <div class="modal-content" style="max-width:400px;max-height:85vh;overflow-y:auto;">
                    <div class="modal-header">
                        <h3>${o.orderId}</h3>
                        <button class="close-modal" onclick="this.closest('.modal').remove()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="modal-body" style="padding:16px;display:flex;flex-direction:column;gap:14px;">
                        <div style="background:var(--surface);padding:12px;border-radius:10px;">
                            <p style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">STATUS</p>
                            ${customerOrderBadge(o.status)}
                            ${
                              o.statusHistory
                                ?.slice(-3)
                                .map(
                                  (h) => `
                                <p style="font-size:12px;color:var(--text-muted);margin-top:6px;">
                                    ${new Date(h.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — ${h.status.replace('_', ' ')}
                                    ${h.note ? '· ' + h.note : ''}
                                </p>`,
                                )
                                .join('') || ''
                            }
                        </div>
                        <div style="background:var(--surface);padding:12px;border-radius:10px;">
                            <p style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">ITEMS</p>
                            ${o.items
                              .map(
                                (i) => `
                                <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border-light);">
                                    <span style="font-size:13px;">${i.name} × ${i.quantity}</span>
                                    <strong style="font-size:13px;">₹${i.price * i.quantity}</strong>
                                </div>`,
                              )
                              .join('')}
                            <div style="display:flex;justify-content:space-between;padding:8px 0 0;font-weight:700;">
                                <span>Total</span><span>₹${o.totalAmount}</span>
                            </div>
                        </div>
                        <div style="background:var(--surface);padding:12px;border-radius:10px;">
                            <p style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">DELIVERY TO</p>
                            <p style="font-size:13px;">${o.address}${o.landmark ? ', ' + o.landmark : ''}</p>
                            <p style="font-size:12px;color:var(--text-muted);">Pincode: ${o.pincode}</p>
                        </div>
                        ${
                          o.status === 'delivered'
                            ? `
                        <button onclick="this.closest('.modal').remove(); showRaiseIssueModal('${o._id}','${o.orderId}')"
                            style="padding:12px;border:1.5px solid var(--error);border-radius:10px;font-size:14px;font-weight:600;color:var(--error);background:white;cursor:pointer;">
                            Report an Issue
                        </button>`
                            : ''
                        }
                    </div>
                </div>`
      document.body.appendChild(modal)
    })
    .catch(() => showToast('Could not load order details', 'error'))
}

function showRaiseIssueModal(orderId, orderStringId) {
  document.getElementById('raise-issue-modal')?.remove()
  const modal = document.createElement('div')
  modal.id = 'raise-issue-modal'
  modal.className = 'modal active'
  modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeModal('raise-issue-modal')"></div>
        <div class="modal-content" style="max-width:380px;">
            <div class="modal-header">
                <h3>Report an Issue</h3>
                <button class="close-modal" onclick="closeModal('raise-issue-modal')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Order: <strong>${orderStringId}</strong></p>
                <div class="form-group">
                    <label>Issue Type *</label>
                    <select id="issue-type" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;background:white;">
                        <option value="">Select issue type</option>
                        <option value="wrong_item">Wrong item received</option>
                        <option value="missing_item">Item was missing</option>
                        <option value="quality">Quality not satisfactory</option>
                        <option value="not_delivered">Order not delivered</option>
                        <option value="late_delivery">Very late delivery</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Describe the issue *</label>
                    <textarea id="issue-desc" rows="4" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;resize:vertical;" placeholder="Please describe what went wrong..."></textarea>
                </div>
                <p id="issue-error" style="color:var(--error);font-size:13px;display:none;margin-bottom:8px;"></p>
                <button onclick="submitIssue('${orderId}')" id="issue-submit-btn" class="btn btn-primary">
                    Submit Report
                </button>
            </div>
        </div>`
  document.body.appendChild(modal)
}

async function submitIssue(orderId) {
  const issueType = document.getElementById('issue-type')?.value
  const description = document.getElementById('issue-desc')?.value.trim()
  const errEl = document.getElementById('issue-error')
  const btn = document.getElementById('issue-submit-btn')

  if (!issueType || !description) {
    errEl.textContent = 'Please select issue type and describe the problem'
    errEl.style.display = 'block'
    return
  }
  btn.textContent = 'Submitting...'
  btn.disabled = true
  try {
    await api('/issues', {
      method: 'POST',
      body: JSON.stringify({ orderId, issueType, description }),
    })
    closeModal('raise-issue-modal')
    showToast('Issue reported! We will get back to you on WhatsApp.', 'success')
  } catch (err) {
    errEl.textContent = err.message
    errEl.style.display = 'block'
    btn.textContent = 'Submit Report'
    btn.disabled = false
  }
}

function showAddresses() {
  if (!customerToken) {
    showToast('Please login to manage addresses', 'warning')
    return
  }
  showToast('Address management coming soon!', 'warning')
}

function showWallet() {
  showToast('Wallet feature coming in next version!', 'warning')
}

function showSupport() {
  const phone = process?.env?.BUSINESS_WHATSAPP || '919876543210'
  const url = `https://wa.me/${phone}?text=${encodeURIComponent('Hi, I need help with my The Fish Merchant order.')}`
  window.open(url, '_blank')
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
  requestGPSLocation(({ address, pincode }) => {
    window.appData.deliveryLocation.fromGPS = true
    const display = address.split(',').slice(-2).join(',').trim()
    document.getElementById('delivery-address').textContent = display || address
    closeModal('location-modal')
  })
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

// ── Customer auth state ──────────────────────────────────────────
let customerToken = localStorage.getItem('fc_customer_token') || null
let currentCustomer = null

async function initCustomerAuth() {
  if (!customerToken) return
  try {
    const res = await api('/customers/me')
    currentCustomer = res.data
    updateAccountUI()
  } catch {
    customerToken = null
    localStorage.removeItem('fc_customer_token')
  }
}

function updateAccountUI() {
  const nameEl = document.getElementById('account-name')
  const phoneEl = document.getElementById('account-phone')
  if (currentCustomer) {
    if (nameEl)
      nameEl.textContent = currentCustomer.name || 'The Fish Merchant User'
    if (phoneEl) phoneEl.textContent = '+' + currentCustomer.phone
  }
}

async function sendOTP() {
  const raw = document.getElementById('phone-input')?.value.trim()
  if (!raw || raw.length < 10) {
    showToast('Enter a valid 10-digit number', 'error')
    return
  }

  const btn = document.querySelector('#login-modal .btn-primary')
  if (btn) {
    btn.textContent = 'Sending OTP…'
    btn.disabled = true
  }

  try {
    const res = await api('/customers/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: raw }),
    })
    document.getElementById('otp-phone').textContent = '+' + res.phone
    closeModal('login-modal')
    document.getElementById('otp-modal').classList.add('active')
    startResendTimer()
    // In dev mode backend returns OTP — show it for testing
    if (res.otp) showToast(`Dev mode OTP: ${res.otp}`, 'warning')
  } catch (err) {
    showToast(err.message || 'Failed to send OTP', 'error')
  } finally {
    if (btn) {
      btn.textContent = 'Send OTP'
      btn.disabled = false
    }
  }
}

function startResendTimer() {
  let timer = 30
  const btn = document.getElementById('resend-btn')
  if (!btn) return
  btn.disabled = true
  const iv = setInterval(() => {
    timer--
    btn.textContent = `Resend in 00:${timer.toString().padStart(2, '0')}`
    if (timer <= 0) {
      clearInterval(iv)
      btn.disabled = false
      btn.textContent = 'Resend OTP'
    }
  }, 1000)
}

async function resendOTP() {
  const phoneText = document.getElementById('otp-phone')?.textContent || ''
  const phone = phoneText.replace(/[^0-9]/g, '').slice(-10)
  try {
    await api('/customers/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
    showToast('New OTP sent to your WhatsApp!', 'success')
    startResendTimer()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input')
  const otp = Array.from(inputs)
    .map((i) => i.value)
    .join('')
  if (otp.length < 5) {
    showToast('Please enter the complete OTP', 'error')
    return
  }

  const phoneText = document.getElementById('otp-phone')?.textContent || ''
  const phone = phoneText.replace(/[^0-9]/g, '').slice(-10)

  const btn = document.querySelector('#otp-modal .btn-primary')
  if (btn) {
    btn.textContent = 'Verifying…'
    btn.disabled = true
  }

  try {
    const res = await api('/customers/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    })
    customerToken = res.token
    currentCustomer = res.customer
    localStorage.setItem('fc_customer_token', customerToken)
    closeModal('otp-modal')
    updateAccountUI()
    showToast('Login successful! 🎉', 'success')
  } catch (err) {
    showToast(err.message, 'error')
    if (btn) {
      btn.textContent = 'Verify & Continue'
      btn.disabled = false
    }
  }
}

function customerLogout() {
  customerToken = null
  currentCustomer = null
  localStorage.removeItem('fc_customer_token')
  document.getElementById('account-name').textContent = 'Guest User'
  document.getElementById('account-phone').textContent = '+91 9876543210'
  showToast('Logged out', 'success')
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

// =====================================================
// ADMIN PANEL — FULL PRODUCT MANAGEMENT
// =====================================================

function openAdminPanel() {
  if (!state.adminLoggedIn) {
    showAdminLoginModal()
    return
  }
  document.getElementById('admin-panel').style.display = 'flex'
  showAdminSection('dashboard')
}

function closeAdminPanel() {
  document.getElementById('admin-panel').style.display = 'none'
}

function adminLogout() {
  adminToken = null
  state.adminLoggedIn = false
  localStorage.removeItem('fc_admin_token')
  closeAdminPanel()
  showToast('Logged out of admin', 'success')
}

// ── Admin Login Modal ────────────────────────────────────────────
function showAdminLoginModal() {
  const existing = document.getElementById('admin-login-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'admin-login-modal'
  modal.className = 'modal active'
  modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeAdminLogin()"></div>
        <div class="modal-content" style="max-width:360px;">
            <div class="modal-header">
                <h3>Admin Login</h3>
                <button class="close-modal" onclick="closeAdminLogin()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="admin-login-user" placeholder="admin" autocomplete="username">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="admin-login-pass" placeholder="••••••••" autocomplete="current-password"
                        onkeydown="if(event.key==='Enter') doAdminLogin()">
                </div>
                <button class="btn btn-primary" onclick="doAdminLogin()" id="admin-login-btn">Login to Admin</button>
                <p id="admin-login-err" style="color:var(--error);font-size:13px;margin-top:8px;display:none;"></p>
            </div>
        </div>`
  document.body.appendChild(modal)
  setTimeout(() => document.getElementById('admin-login-user')?.focus(), 100)
}

function closeAdminLogin() {
  document.getElementById('admin-login-modal')?.remove()
}

async function doAdminLogin() {
  const username = document.getElementById('admin-login-user')?.value.trim()
  const password = document.getElementById('admin-login-pass')?.value
  const btn = document.getElementById('admin-login-btn')
  const errEl = document.getElementById('admin-login-err')

  if (!username || !password) {
    showAdminLoginError('Please enter username and password')
    return
  }

  btn.textContent = 'Logging in...'
  btn.disabled = true
  errEl.style.display = 'none'

  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    adminToken = res.token
    state.adminLoggedIn = true
    localStorage.setItem('fc_admin_token', adminToken)
    closeAdminLogin()
    showToast('Welcome to Admin Panel!', 'success')
    document.getElementById('admin-panel').style.display = 'flex'
    showAdminSection('dashboard')
  } catch (err) {
    showAdminLoginError(err.message || 'Invalid credentials')
    btn.textContent = 'Login to Admin'
    btn.disabled = false
  }
}

function showAdminLoginError(msg) {
  const el = document.getElementById('admin-login-err')
  if (el) {
    el.textContent = msg
    el.style.display = 'block'
  }
}

// ── Admin Section Router ─────────────────────────────────────────
function showAdminSection(section) {
  document.querySelectorAll('.admin-nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section)
  })
  const titles = {
    dashboard: 'Dashboard',
    products: 'Product Management',
    orders: 'Orders',
    categories: 'Categories',
    hero: 'Banners · Coupons · Settings',
    reports: 'Reports',
    users: 'Customers',
    issues: 'Issue Reports',
  }
  document.getElementById('admin-page-title').textContent =
    titles[section] || section

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
    case 'issues':
      renderAdminIssues(content)
      break
  }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — PRODUCT MANAGEMENT (fully working)
// ─────────────────────────────────────────────────────────────────

let adminProductState = {
  search: '',
  category: 'all',
  page: 1,
  loading: false,
}

async function renderAdminProducts(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    <h4 id="admin-prod-count">Products</h4>
                    <div style="display:flex;gap:8px;flex:1;min-width:200px;">
                        <input type="text" id="admin-prod-search" placeholder="Search products..."
                            style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;"
                            oninput="debounceAdminProdSearch(this.value)">
                        <select id="admin-prod-cat" onchange="filterAdminProducts()"
                            style="padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;background:white;">
                            <option value="all">All Categories</option>
                            ${window.appData.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="showProductForm(null)"
                    style="width:auto;padding:8px 16px;white-space:nowrap;">
                    + Add Product
                </button>
            </div>
            <div class="admin-card-body" style="padding:0;" id="admin-prod-body">
                <div style="padding:40px;text-align:center;color:var(--text-muted);">Loading products...</div>
            </div>
        </div>`
  await loadAdminProducts()
}

let _prodSearchTimer
function debounceAdminProdSearch(val) {
  clearTimeout(_prodSearchTimer)
  _prodSearchTimer = setTimeout(() => {
    adminProductState.search = val
    adminProductState.page = 1
    loadAdminProducts()
  }, 350)
}

function filterAdminProducts() {
  adminProductState.category =
    document.getElementById('admin-prod-cat')?.value || 'all'
  adminProductState.page = 1
  loadAdminProducts()
}

async function loadAdminProducts() {
  const body = document.getElementById('admin-prod-body')
  if (!body) return
  body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading...</div>`

  try {
    const { search, category, page } = adminProductState
    let qs = `?page=${page}&limit=20`
    if (search) qs += `&search=${encodeURIComponent(search)}`
    if (category && category !== 'all') qs += `&category=${category}`

    const res = await api(`/products/admin${qs}`)
    const products = res.data

    const countEl = document.getElementById('admin-prod-count')
    if (countEl) countEl.textContent = `Products (${res.total})`

    if (!products.length) {
      body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">No products found</div>`
      return
    }

    body.innerHTML = `
            <table class="admin-table">
                <thead><tr>
                    <th>Product</th><th>Category</th>
                    <th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                    ${products
                      .map(
                        (p) => `
                        <tr id="prod-row-${p._id}">
                            <td>
                                <div class="product-cell">
                                    <img src="${p.images[0] || 'https://via.placeholder.com/40'}"
                                        class="product-image" alt="${p.name}"
                                        onerror="this.src='https://via.placeholder.com/40'">
                                    <div>
                                        <div style="font-weight:600;font-size:13px;">${p.name}</div>
                                        <div style="font-size:11px;color:var(--text-muted);">${p.weight} · ${p.pieces}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span style="font-size:12px;background:var(--surface);padding:3px 8px;border-radius:20px;">
                                    ${p.category}
                                </span>
                            </td>
                            <td>
                                <div style="font-weight:700;">₹${p.price}</div>
                                ${p.originalPrice > p.price ? `<div style="font-size:11px;color:var(--text-muted);text-decoration:line-through;">₹${p.originalPrice}</div>` : ''}
                            </td>
                            <td>
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <input type="number" min="0" value="${p.stockQty}"
                                        style="width:60px;padding:4px 6px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;"
                                        onchange="quickUpdateStock('${p._id}', this.value)">
                                </div>
                            </td>
                            <td>
                                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                                    <input type="checkbox" ${p.inStock ? 'checked' : ''}
                                        onchange="quickToggleStock('${p._id}', this.checked)"
                                        style="width:16px;height:16px;cursor:pointer;">
                                    <span class="status ${p.inStock ? (p.stockQty < 10 ? 'low-stock' : 'in-stock') : 'out-of-stock'}" id="stock-badge-${p._id}">
                                        ${p.inStock ? (p.stockQty < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
                                    </span>
                                </label>
                                ${!p.isActive ? `<span style="font-size:11px;color:var(--error);">Hidden</span>` : ''}
                            </td>
                            <td>
                                <div class="admin-actions">
                                    <button class="admin-action-btn edit" title="Edit product"
                                        onclick="showProductForm('${p._id}')">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                    <button class="admin-action-btn" title="${p.isActive ? 'Hide product' : 'Show product'}"
                                        onclick="toggleProductActive('${p._id}', ${p.isActive})"
                                        style="color:${p.isActive ? 'var(--warning)' : 'var(--accent)'}">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            ${
                                              p.isActive
                                                ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                                                : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                                            }
                                        </svg>
                                    </button>
                                    <button class="admin-action-btn delete" title="Delete product"
                                        onclick="deleteProduct('${p._id}', '${p.name.replace(/'/g, "\\'")}')">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3,6 5,6 21,6"/>
                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>`,
                      )
                      .join('')}
                </tbody>
            </table>
            ${
              res.pages > 1
                ? `
                <div style="display:flex;justify-content:center;gap:8px;padding:16px;">
                    ${Array.from(
                      { length: res.pages },
                      (_, i) => `
                        <button onclick="adminProductState.page=${i + 1};loadAdminProducts()"
                            style="padding:6px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);
                                   background:${adminProductState.page === i + 1 ? 'var(--primary)' : 'white'};
                                   color:${adminProductState.page === i + 1 ? 'white' : 'var(--text-primary)'};
                                   font-size:13px;cursor:pointer;">${i + 1}</button>`,
                    ).join('')}
                </div>`
                : ''
            }`
  } catch (err) {
    body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--error);">${err.message}</div>`
  }
}

// ── Quick inline stock update ────────────────────────────────────
async function quickUpdateStock(id, qty) {
  try {
    const q = parseInt(qty, 10)
    await api(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stockQty: q, inStock: q > 0 }),
    })
    const badge = document.getElementById(`stock-badge-${id}`)
    if (badge) {
      badge.className = `status ${q > 0 ? (q < 10 ? 'low-stock' : 'in-stock') : 'out-of-stock'}`
      badge.textContent =
        q > 0 ? (q < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock'
    }
    // Update local data too
    const p = window.appData.products.find((p) => p._id === id || p.id === id)
    if (p) {
      p.stockQty = q
      p.inStock = q > 0
    }
    refreshProductCards()
  } catch (err) {
    showToast('Failed to update stock: ' + err.message, 'error')
  }
}

async function quickToggleStock(id, inStock) {
  try {
    await api(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ inStock }),
    })
    const badge = document.getElementById(`stock-badge-${id}`)
    if (badge) {
      badge.className = `status ${inStock ? 'in-stock' : 'out-of-stock'}`
      badge.textContent = inStock ? 'In Stock' : 'Out of Stock'
    }
    const p = window.appData.products.find((p) => p._id === id || p.id === id)
    if (p) p.inStock = inStock
    refreshProductCards()
  } catch (err) {
    showToast('Failed: ' + err.message, 'error')
  }
}

async function toggleProductActive(id, currentlyActive) {
  try {
    await api(`/products/${id}/toggle-active`, { method: 'PATCH' })
    showToast(
      `Product ${currentlyActive ? 'hidden from' : 'shown in'} store`,
      'success',
    )
    await loadAdminProducts()
    await loadLiveData()
  } catch (err) {
    showToast('Failed: ' + err.message, 'error')
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}" permanently? This cannot be undone.`)) return
  try {
    await api(`/products/${id}`, { method: 'DELETE' })
    showToast(`"${name}" deleted`, 'success')
    window.appData.products = window.appData.products.filter(
      (p) => p._id !== id && p.id !== id,
    )
    await loadAdminProducts()
    refreshProductCards()
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error')
  }
}

// ── Product Form (Add / Edit) ─────────────────────────────────────
async function showProductForm(productId) {
  let product = null
  if (productId) {
    try {
      const res = await api(`/products/${productId}`)
      product = res.data
    } catch (err) {
      showToast('Could not load product: ' + err.message, 'error')
      return
    }
  }

  const isEdit = !!product
  const p = product || {}

  // Remove old form if exists
  document.getElementById('product-form-modal')?.remove()

  const modal = document.createElement('div')
  modal.id = 'product-form-modal'
  modal.style.cssText =
    'position:fixed;inset:0;z-index:600;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px;background:rgba(0,0,0,0.5);'

  const CATEGORIES = [
    { id: 'fish', label: 'Fish & Seafood' },
    { id: 'prawns', label: 'Prawns & Shrimps' },
    { id: 'crabs', label: 'Crabs & Lobsters' },
    { id: 'squid', label: 'Squid & Octopus' },
    { id: 'ready-to-cook', label: 'Ready to Cook' },
    { id: 'combos', label: 'Seafood Combos' },
    { id: 'dried', label: 'Dried Seafood' },
    { id: 'specials', label: 'Chef Specials' },
  ]

  modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:640px;margin:auto;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border);background:var(--surface);">
                <h3 style="font-size:18px;font-weight:700;">${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
                <button onclick="document.getElementById('product-form-modal').remove()"
                    style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--surface-dark);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <div style="padding:24px;display:flex;flex-direction:column;gap:16px;">

                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" id="pf-name" value="${p.name || ''}" placeholder="e.g. Tiger Prawns - Large">
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="pf-category" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);">
                            ${CATEGORIES.map((c) => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Description *</label>
                    <textarea id="pf-desc" rows="2" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);resize:vertical;" placeholder="Short product description">${p.description || ''}</textarea>
                </div>

                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Subcategory</label>
                        <input type="text" id="pf-subcat" value="${p.subcategory || ''}" placeholder="e.g. tiger-prawns">
                    </div>
                    <div class="form-group">
                        <label>Badge</label>
                        <select id="pf-badge" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);">
                            <option value="" ${!p.badge ? 'selected' : ''}>None</option>
                            <option value="bestseller" ${p.badge === 'bestseller' ? 'selected' : ''}>Bestseller</option>
                            <option value="new" ${p.badge === 'new' ? 'selected' : ''}>New</option>
                            <option value="premium" ${p.badge === 'premium' ? 'selected' : ''}>Premium</option>
                        </select>
                    </div>
                </div>

                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Selling Price (₹) *</label>
                        <input type="number" id="pf-price" value="${p.price || ''}" placeholder="499" min="0" oninput="calcDiscount()">
                    </div>
                    <div class="form-group">
                        <label>Original / MRP (₹) *</label>
                        <input type="number" id="pf-original" value="${p.originalPrice || ''}" placeholder="599" min="0" oninput="calcDiscount()">
                    </div>
                </div>

                <div style="background:var(--surface);border-radius:var(--radius-sm);padding:10px 14px;font-size:13px;color:var(--text-secondary);">
                    Discount: <strong id="pf-discount-preview" style="color:var(--accent);">${p.discount || 0}% off</strong>
                </div>

                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Weight *</label>
                        <input type="text" id="pf-weight" value="${p.weight || ''}" placeholder="500g">
                    </div>
                    <div class="form-group">
                        <label>Pieces</label>
                        <input type="text" id="pf-pieces" value="${p.pieces || ''}" placeholder="15-18 Pieces">
                    </div>
                </div>

                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Serves</label>
                        <input type="text" id="pf-serves" value="${p.serves || ''}" placeholder="3-4">
                    </div>
                    <div class="form-group">
                        <label>Stock Quantity *</label>
                        <input type="number" id="pf-stock" value="${p.stockQty ?? ''}" placeholder="25" min="0">
                    </div>
                </div>

                <div class="form-group">
                    <label>Product Image URLs</label>
                    <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
                        Upload photos to <a href="https://imgbb.com" target="_blank" style="color:var(--primary);">imgbb.com</a> (free) and paste the direct links below. One URL per line.
                    </p>
                    <textarea id="pf-images" rows="3" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;font-family:monospace;resize:vertical;"
                        placeholder="https://i.ibb.co/abc123/product.jpg&#10;https://i.ibb.co/xyz456/product2.jpg">${(p.images || []).join('\n')}</textarea>
                    <div id="pf-image-preview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
                        ${(p.images || []).map((img) => (img ? `<img src="${img}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--border);" onerror="this.style.display='none'">` : '')).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label>Product Highlights</label>
                    <p style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">One highlight per line (max 6)</p>
                    <textarea id="pf-highlights" rows="4" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);resize:vertical;"
                        placeholder="No added chemicals&#10;Cleaned &amp; ready to cook&#10;Lab tested&#10;Sourced fresh daily">${(p.highlights || []).join('\n')}</textarea>
                </div>

                <div id="pf-error" style="color:var(--error);font-size:13px;display:none;padding:10px;background:#FEE2E2;border-radius:8px;"></div>

                <div style="display:flex;gap:12px;padding-top:8px;">
                    <button onclick="document.getElementById('product-form-modal').remove()"
                        style="flex:1;padding:14px;border:1px solid var(--border);border-radius:var(--radius-md);font-size:15px;font-weight:600;background:white;cursor:pointer;">
                        Cancel
                    </button>
                    <button onclick="saveProduct(${isEdit ? `'${productId}'` : 'null'})" id="pf-save-btn"
                        style="flex:2;padding:14px;background:var(--primary);color:white;border-radius:var(--radius-md);font-size:15px;font-weight:700;cursor:pointer;">
                        ${isEdit ? 'Save Changes' : 'Add Product'}
                    </button>
                </div>

            </div>
        </div>`

  document.body.appendChild(modal)

  // Live image preview on URL change
  document.getElementById('pf-images').addEventListener('input', function () {
    const urls = this.value
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
    document.getElementById('pf-image-preview').innerHTML = urls
      .map(
        (url) =>
          `<img src="${url}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--border);" onerror="this.style.display='none'">`,
      )
      .join('')
  })
}

function calcDiscount() {
  const price = parseFloat(document.getElementById('pf-price')?.value || 0)
  const orig = parseFloat(document.getElementById('pf-original')?.value || 0)
  const el = document.getElementById('pf-discount-preview')
  if (!el) return
  if (orig > price && price > 0) {
    el.textContent = Math.round(((orig - price) / orig) * 100) + '% off'
  } else {
    el.textContent = '0% off'
  }
}

async function saveProduct(productId) {
  const btn = document.getElementById('pf-save-btn')
  const errEl = document.getElementById('pf-error')
  errEl.style.display = 'none'

  const name = document.getElementById('pf-name')?.value.trim()
  const desc = document.getElementById('pf-desc')?.value.trim()
  const category = document.getElementById('pf-category')?.value
  const price = parseFloat(document.getElementById('pf-price')?.value)
  const original = parseFloat(document.getElementById('pf-original')?.value)
  const stock = parseInt(document.getElementById('pf-stock')?.value, 10)
  const weight = document.getElementById('pf-weight')?.value.trim()

  // Validate
  const errors = []
  if (!name) errors.push('Product name is required')
  if (!desc) errors.push('Description is required')
  if (!weight) errors.push('Weight is required')
  if (isNaN(price) || price < 0) errors.push('Valid selling price required')
  if (isNaN(original) || original < 0)
    errors.push('Valid original price required')
  if (isNaN(stock) || stock < 0) errors.push('Valid stock quantity required')

  if (errors.length) {
    errEl.textContent = errors.join(' · ')
    errEl.style.display = 'block'
    return
  }

  const images =
    document
      .getElementById('pf-images')
      ?.value.split('\n')
      .map((u) => u.trim())
      .filter(Boolean) || []
  const highlights =
    document
      .getElementById('pf-highlights')
      ?.value.split('\n')
      .map((h) => h.trim())
      .filter(Boolean)
      .slice(0, 6) || []

  const payload = {
    name,
    description: desc,
    category,
    subcategory: document.getElementById('pf-subcat')?.value.trim() || '',
    badge: document.getElementById('pf-badge')?.value || '',
    weight,
    pieces: document.getElementById('pf-pieces')?.value.trim() || '',
    serves: document.getElementById('pf-serves')?.value.trim() || '',
    price,
    originalPrice: original,
    stockQty: stock,
    inStock: stock > 0,
    images,
    highlights,
  }

  btn.textContent = productId ? 'Saving...' : 'Adding...'
  btn.disabled = true

  try {
    let res
    if (productId) {
      res = await api(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      // Update local appData
      const idx = window.appData.products.findIndex(
        (p) => p._id === productId || p.id === productId,
      )
      if (idx !== -1)
        window.appData.products[idx] = { ...res.data, id: res.data._id }
    } else {
      res = await api('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      window.appData.products.unshift({ ...res.data, id: res.data._id })
    }

    document.getElementById('product-form-modal').remove()
    showToast(res.message, 'success')
    await loadAdminProducts()
    refreshProductCards()
  } catch (err) {
    errEl.textContent = err.message || 'Failed to save product'
    errEl.style.display = 'block'
    btn.textContent = productId ? 'Save Changes' : 'Add Product'
    btn.disabled = false
  }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — DASHBOARD (live analytics)
// ─────────────────────────────────────────────────────────────────

let _dashPeriod = 'month'

async function renderAdminDashboard(container) {
  container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <h3 style="font-size:18px;font-weight:700;">Overview</h3>
            <div style="display:flex;gap:6px;">
                ${['today', 'week', 'month', 'year']
                  .map(
                    (p) => `
                    <button onclick="changeDashPeriod('${p}')" id="dash-period-${p}"
                        style="padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;
                               border:1.5px solid ${_dashPeriod === p ? 'var(--primary)' : 'var(--border)'};
                               background:${_dashPeriod === p ? 'var(--primary)' : 'white'};
                               color:${_dashPeriod === p ? 'white' : 'var(--text-secondary)'};">
                        ${p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>`,
                  )
                  .join('')}
            </div>
        </div>
        <div class="admin-stats" id="dash-stats">
            ${[1, 2, 3, 4].map(() => `<div class="stat-card"><div style="height:60px;background:var(--surface-dark);border-radius:8px;animation:pulse 1.5s infinite;"></div></div>`).join('')}
        </div>
        <div class="admin-grid" style="margin-top:24px;">
            <div class="admin-card">
                <div class="admin-card-header">
                    <h4>Revenue Chart</h4>
                    <span id="dash-chart-label" style="font-size:12px;color:var(--text-muted);">Loading...</span>
                </div>
                <div class="admin-card-body">
                    <div style="position:relative;height:260px;"><canvas id="dash-revenue-chart"></canvas></div>
                </div>
            </div>
            <div class="admin-card">
                <div class="admin-card-header"><h4>Orders by Status</h4></div>
                <div class="admin-card-body" style="display:flex;flex-direction:column;gap:10px;" id="dash-status-bars">
                    <div style="height:120px;background:var(--surface-dark);border-radius:8px;animation:pulse 1.5s infinite;"></div>
                </div>
            </div>
        </div>
        <div class="admin-grid" style="margin-top:24px;">
            <div class="admin-card">
                <div class="admin-card-header"><h4>Top Products</h4></div>
                <div class="admin-card-body" style="padding:0;" id="dash-top-products">
                    <div style="height:160px;background:var(--surface-dark);margin:16px;border-radius:8px;animation:pulse 1.5s infinite;"></div>
                </div>
            </div>
            <div class="admin-card">
                <div class="admin-card-header">
                    <h4>💎 Golden Nuggets</h4>
                    <span style="font-size:11px;color:var(--text-muted);">Revenue boosters</span>
                </div>
                <div class="admin-card-body" style="padding:0;" id="dash-nuggets">
                    <div style="height:160px;background:var(--surface-dark);margin:16px;border-radius:8px;animation:pulse 1.5s infinite;"></div>
                </div>
            </div>
        </div>
        <div class="admin-card" style="margin-top:24px;">
            <div class="admin-card-header"><h4>Recent Orders</h4><button onclick="showAdminSection('orders')" style="font-size:13px;color:var(--primary);font-weight:600;">View All →</button></div>
            <div class="admin-card-body" style="padding:0;" id="dash-recent-orders">
                <div style="height:80px;background:var(--surface-dark);margin:16px;border-radius:8px;animation:pulse 1.5s infinite;"></div>
            </div>
        </div>`

  loadDashboardData()
}

async function changeDashPeriod(p) {
  _dashPeriod = p
  ;['today', 'week', 'month', 'year'].forEach((x) => {
    const btn = document.getElementById(`dash-period-${x}`)
    if (!btn) return
    const active = x === p
    btn.style.background = active ? 'var(--primary)' : 'white'
    btn.style.color = active ? 'white' : 'var(--text-secondary)'
    btn.style.borderColor = active ? 'var(--primary)' : 'var(--border)'
  })
  loadDashboardData()
}

let _revenueChart = null

async function loadDashboardData() {
  try {
    const [sumRes, chartRes, topRes, statusRes, nuggetRes, ordersRes] =
      await Promise.all([
        api(`/analytics/summary?period=${_dashPeriod}`),
        api(`/analytics/revenue-chart?period=${_dashPeriod}`),
        api(`/analytics/top-products?period=${_dashPeriod}&limit=5`),
        api(`/analytics/order-status?period=${_dashPeriod}`),
        api(`/analytics/golden-nuggets?period=${_dashPeriod}`),
        api(`/orders?limit=5`),
      ])

    // ── Stat cards
    const s = sumRes.data
    const g = (v) =>
      v > 0
        ? `<span style="color:var(--accent)">▲ ${v}%</span>`
        : v < 0
          ? `<span style="color:var(--error)">▼ ${Math.abs(v)}%</span>`
          : `<span style="color:var(--text-muted)">—</span>`
    document.getElementById('dash-stats').innerHTML = `
            <div class="stat-card"><p class="label">Revenue</p><p class="value">₹${s.revenue.toLocaleString('en-IN')}</p><p class="change">${g(s.revenueGrowth)} vs prev period</p></div>
            <div class="stat-card"><p class="label">Orders</p><p class="value">${s.orders}</p><p class="change">${g(s.orderGrowth)} vs prev period</p></div>
            <div class="stat-card"><p class="label">Avg Order</p><p class="value">₹${s.avgOrder.toLocaleString('en-IN')}</p><p class="change">per order</p></div>
            <div class="stat-card"><p class="label">New Customers</p><p class="value">${s.newCustomers}</p><p class="change">${s.activeProducts} products active</p></div>`

    // ── Revenue chart (Chart.js)
    const labels = chartRes.data.map((d) => d.label)
    const revenues = chartRes.data.map((d) => d.revenue)
    const chartLabel = document.getElementById('dash-chart-label')
    if (chartLabel)
      chartLabel.textContent = `₹${revenues.reduce((a, b) => a + b, 0).toLocaleString('en-IN')} total`
    const canvas = document.getElementById('dash-revenue-chart')
    if (canvas) {
      if (_revenueChart) _revenueChart.destroy()
      if (window.Chart) {
        _revenueChart = new window.Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Revenue (₹)',
                data: revenues,
                backgroundColor: 'rgba(217,35,46,0.15)',
                borderColor: '#D9232E',
                borderWidth: 2,
                borderRadius: 6,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                grid: { display: false },
                ticks: { maxTicksLimit: 8, font: { size: 11 } },
              },
              y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                  callback: (v) =>
                    '₹' + (v >= 1000 ? Math.round(v / 1000) + 'K' : v),
                  font: { size: 11 },
                },
              },
            },
          },
        })
      }
    }

    // ── Status bars
    const st = statusRes.data
    const total = Object.values(st).reduce((a, b) => a + b, 0) || 1
    const statusConfig = [
      { key: 'pending', label: 'Pending', color: '#F59E0B' },
      { key: 'confirmed', label: 'Confirmed', color: '#3B82F6' },
      { key: 'preparing', label: 'Preparing', color: '#8B5CF6' },
      { key: 'out_for_delivery', label: 'Out for delivery', color: '#F97316' },
      { key: 'delivered', label: 'Delivered', color: '#10B981' },
      { key: 'cancelled', label: 'Cancelled', color: '#EF4444' },
    ]
    document.getElementById('dash-status-bars').innerHTML = statusConfig
      .map(
        (s) => `
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:90px;font-size:12px;color:var(--text-secondary);">${s.label}</span>
                <div style="flex:1;height:8px;background:var(--surface-dark);border-radius:4px;overflow:hidden;">
                    <div style="width:${Math.round(((st[s.key] || 0) / total) * 100)}%;height:100%;background:${s.color};border-radius:4px;transition:width 0.5s;"></div>
                </div>
                <span style="font-size:12px;font-weight:700;width:28px;text-align:right;">${st[s.key] || 0}</span>
            </div>`,
      )
      .join('')

    // ── Top products
    document.getElementById('dash-top-products').innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
                <tbody>${topRes.data
                  .map(
                    (p, i) => `
                    <tr>
                        <td><div class="product-cell">
                            ${p.image ? `<img src="${p.image}" class="product-image" onerror="this.style.display='none'">` : `<div style="width:32px;height:32px;background:var(--surface-dark);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;">${['🐟', '🦐', '🦀', '🦑', '🍱'][i] || '🐠'}</div>`}
                            <span style="font-weight:600;">${p._id}</span>
                        </div></td>
                        <td>${p.unitsSold}</td>
                        <td><strong>₹${Math.round(p.revenue).toLocaleString('en-IN')}</strong></td>
                    </tr>`,
                  )
                  .join('')}
                </tbody>
            </table>`

    // ── Golden Nuggets
    const ng = nuggetRes.data
    document.getElementById('dash-nuggets').innerHTML = `
            <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
                <div style="background:#FEF3C7;border-radius:10px;padding:12px;">
                    <p style="font-size:11px;font-weight:700;color:#92400E;margin-bottom:6px;">🏆 HIGH VALUE ORDERS</p>
                    ${
                      ng.highTicket
                        .slice(0, 3)
                        .map(
                          (o) =>
                            `<p style="font-size:12px;color:#78350F;">${o.customerName} · <strong>₹${o.totalAmount}</strong> · ${o.items.length} items</p>`,
                        )
                        .join('') ||
                      '<p style="font-size:12px;color:var(--text-muted);">No data yet</p>'
                    }
                </div>
                <div style="background:#EDE9FE;border-radius:10px;padding:12px;">
                    <p style="font-size:11px;font-weight:700;color:#4C1D95;margin-bottom:6px;">⏰ PEAK HOURS</p>
                    ${ng.peakHours.map((h) => `<p style="font-size:12px;color:#5B21B6;">${h._id}:00 – ${(h._id + 1) % 24}:00 · <strong>${h.count} orders</strong></p>`).join('') || '<p style="font-size:12px;color:var(--text-muted);">No data yet</p>'}
                </div>
                <div style="background:#D1FAE5;border-radius:10px;padding:12px;">
                    <p style="font-size:11px;font-weight:700;color:#064E3B;margin-bottom:6px;">🔁 LOYAL BUYERS</p>
                    ${
                      ng.frequentBuyers
                        .slice(0, 2)
                        .map(
                          (b) =>
                            `<p style="font-size:12px;color:#065F46;">${b.name || b._id} · <strong>${b.orders} orders</strong> · ₹${Math.round(b.spent).toLocaleString()}</p>`,
                        )
                        .join('') ||
                      '<p style="font-size:12px;color:var(--text-muted);">No data yet</p>'
                    }
                </div>
            </div>`

    // ── Recent orders
    const recentOrders = ordersRes.data || []
    document.getElementById('dash-recent-orders').innerHTML =
      recentOrders.length
        ? `
            <table class="admin-table">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>${recentOrders
                  .map(
                    (o) => `
                    <tr>
                        <td><strong>${o.orderId}</strong></td>
                        <td>${o.customerName}<br><span style="font-size:11px;color:var(--text-muted);">${o.customerPhone}</span></td>
                        <td><strong>₹${o.totalAmount}</strong></td>
                        <td>${orderStatusBadge(o.status)}</td>
                        <td style="font-size:12px;">${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>`,
                  )
                  .join('')}
                </tbody>
            </table>`
        : `<p style="padding:20px;color:var(--text-muted);text-align:center;">No orders yet</p>`
  } catch (err) {
    console.error('Dashboard load error:', err)
    document.getElementById('dash-stats').innerHTML =
      `<div style="grid-column:1/-1;padding:20px;color:var(--error);">Failed to load dashboard: ${err.message}</div>`
  }
}

function orderStatusBadge(status) {
  const map = {
    pending: ['#FEF3C7', '#92400E', 'Pending'],
    confirmed: ['#DBEAFE', '#1E40AF', 'Confirmed'],
    preparing: ['#EDE9FE', '#5B21B6', 'Preparing'],
    out_for_delivery: ['#FEE2E2', '#991B1B', 'Out for Delivery'],
    delivered: ['#D1FAE5', '#065F46', 'Delivered'],
    cancelled: ['#FEE2E2', '#991B1B', 'Cancelled'],
  }
  const [bg, col, label] = map[status] || ['#F3F4F6', '#374151', status]
  return `<span style="background:${bg};color:${col};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;">${label}</span>`
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — ORDERS (live, with status updates)
// ─────────────────────────────────────────────────────────────────

let _ordersFilter = { status: 'all', page: 1, search: '' }

async function renderAdminOrders(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header" style="flex-wrap:wrap;gap:12px;">
                <h4 id="orders-count-label">Orders</h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${[
                      'all',
                      'pending',
                      'confirmed',
                      'preparing',
                      'out_for_delivery',
                      'delivered',
                      'cancelled',
                    ]
                      .map(
                        (s) => `
                        <button onclick="filterOrders('${s}')" id="ord-tab-${s}"
                            style="padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;
                                   border:1.5px solid var(--border);background:white;color:var(--text-secondary);">
                            ${s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>`,
                      )
                      .join('')}
                    <input type="text" placeholder="Search..." onInput="searchOrders(this.value)"
                        style="padding:5px 12px;border:1.5px solid var(--border);border-radius:20px;font-size:13px;width:160px;">
                </div>
            </div>
            <div class="admin-card-body" style="padding:0;" id="orders-table-body">
                <div style="padding:40px;text-align:center;color:var(--text-muted);">Loading orders...</div>
            </div>
        </div>`

  filterOrders('all')
}

let _ordersSearchTimer
function searchOrders(val) {
  clearTimeout(_ordersSearchTimer)
  _ordersSearchTimer = setTimeout(() => {
    _ordersFilter.search = val
    _ordersFilter.page = 1
    loadOrders()
  }, 350)
}

function filterOrders(status) {
  _ordersFilter.status = status
  _ordersFilter.page = 1
  document.querySelectorAll('[id^="ord-tab-"]').forEach((b) => {
    const active = b.id === `ord-tab-${status}`
    b.style.background = active ? 'var(--primary)' : 'white'
    b.style.color = active ? 'white' : 'var(--text-secondary)'
    b.style.borderColor = active ? 'var(--primary)' : 'var(--border)'
  })
  loadOrders()
}

async function loadOrders() {
  const body = document.getElementById('orders-table-body')
  if (!body) return
  body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading...</div>`
  try {
    const { status, page, search } = _ordersFilter
    let qs = `?page=${page}&limit=15`
    if (status !== 'all') qs += `&status=${status}`
    if (search) qs += `&search=${encodeURIComponent(search)}`
    const res = await api(`/orders${qs}`)
    const orders = res.data
    const label = document.getElementById('orders-count-label')
    if (label) label.textContent = `Orders (${res.total})`
    if (!orders.length) {
      body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">No orders found</div>`
      return
    }
    body.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                    ${orders
                      .map(
                        (o) => `
                        <tr id="order-row-${o._id}">
                            <td><strong style="font-family:monospace;">${o.orderId}</strong></td>
                            <td>
                                <p style="font-weight:600;font-size:13px;">${o.customerName}</p>
                                <p style="font-size:11px;color:var(--text-muted);">${o.customerPhone}</p>
                            </td>
                            <td style="font-size:13px;">${o.items.length} item${o.items.length !== 1 ? 's' : ''}</td>
                            <td><strong>₹${o.totalAmount}</strong></td>
                            <td>${orderStatusBadge(o.status)}</td>
                            <td style="font-size:12px;color:var(--text-muted);">${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                                <div class="admin-actions">
                                    <button class="admin-action-btn" title="View details" onclick="viewOrderDetail('${o._id}')">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </button>
                                    <select onchange="updateOrderStatus('${o._id}',this.value)"
                                        style="padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:white;cursor:pointer;">
                                        <option value="">Update...</option>
                                        <option value="confirmed">Confirm</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancel</option>
                                    </select>
                                </div>
                            </td>
                        </tr>`,
                      )
                      .join('')}
                </tbody>
            </table>
            ${
              res.pages > 1
                ? `<div style="display:flex;justify-content:center;gap:8px;padding:16px;">
                ${Array.from(
                  { length: res.pages },
                  (_, i) => `
                    <button onclick="_ordersFilter.page=${i + 1};loadOrders()"
                        style="padding:5px 12px;border:1px solid var(--border);border-radius:6px;
                               background:${_ordersFilter.page === i + 1 ? 'var(--primary)' : 'white'};
                               color:${_ordersFilter.page === i + 1 ? 'white' : 'inherit'};font-size:13px;cursor:pointer;">${i + 1}</button>`,
                ).join('')}
            </div>`
                : ''
            }`
  } catch (err) {
    body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--error);">${err.message}</div>`
  }
}

async function updateOrderStatus(orderId, status) {
  if (!status) return

  let deliveryFee = undefined
  let cancelReason = ''

  if (status === 'confirmed') {
    // Show delivery fee input modal
    const feeInput = await showDeliveryFeePrompt(orderId)
    if (feeInput === null) return // user cancelled
    deliveryFee = feeInput
  }

  if (status === 'cancelled') {
    cancelReason = prompt('Reason for cancellation (optional):') || ''
  }

  try {
    const body = { status, cancelReason }
    if (deliveryFee !== undefined) body.deliveryFee = deliveryFee
    await api(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    showToast(`Order → ${status.replace('_', ' ')}`, 'success')
    loadOrders()
  } catch (err) {
    showToast('Failed: ' + err.message, 'error')
  }
}

function showDeliveryFeePrompt(orderId) {
  return new Promise((resolve) => {
    document.getElementById('delivery-fee-modal')?.remove()
    const modal = document.createElement('div')
    modal.id = 'delivery-fee-modal'
    modal.style.cssText =
      'position:fixed;inset:0;z-index:700;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);'
    modal.innerHTML = `
            <div style="background:white;border-radius:16px;width:100%;max-width:360px;padding:24px;">
                <h3 style="font-size:17px;font-weight:700;margin-bottom:6px;">Confirm Order</h3>
                <p style="font-size:13px;color:var(--text-muted);margin-bottom:18px;">Set the delivery charge for this order based on the customer's location.</p>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;display:block;">Delivery Fee (₹)</label>
                    <input type="number" id="confirm-delivery-fee" value="39" min="0" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:16px;font-weight:700;">
                    <p style="font-size:12px;color:var(--text-muted);margin-top:6px;">Set 0 for free delivery</p>
                </div>
                <div style="background:#EFF6FF;border-radius:8px;padding:10px 12px;margin-bottom:16px;">
                    <p style="font-size:12px;color:#1E40AF;margin:0;">📲 Customer will receive a WhatsApp confirmation with the order details and delivery charge.</p>
                </div>
                <div style="display:flex;gap:10px;">
                    <button onclick="document.getElementById('delivery-fee-modal').remove(); window._feeResolve(null);" style="flex:1;padding:12px;border:1px solid var(--border);border-radius:10px;font-size:14px;background:white;cursor:pointer;">Cancel</button>
                    <button onclick="const f=parseFloat(document.getElementById('confirm-delivery-fee').value)||0;document.getElementById('delivery-fee-modal').remove();window._feeResolve(f);" style="flex:2;padding:12px;background:var(--primary);color:white;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Confirm Order</button>
                </div>
            </div>`
    window._feeResolve = resolve
    document.body.appendChild(modal)
    document.getElementById('confirm-delivery-fee')?.focus()
  })
}

function viewOrderDetail(orderId) {
  api(`/orders/${orderId}`)
    .then((res) => {
      const o = res.data
      const modal = document.createElement('div')
      modal.style.cssText =
        'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);overflow-y:auto;'
      modal.innerHTML = `
            <div style="background:white;border-radius:16px;width:100%;max-width:520px;padding:24px;max-height:90vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div><h3 style="font-size:18px;font-weight:700;">${o.orderId}</h3><p style="font-size:12px;color:var(--text-muted);">${new Date(o.createdAt).toLocaleString('en-IN')}</p></div>
                    <button onclick="this.closest('div[style]').remove()" style="width:32px;height:32px;background:var(--surface);border-radius:50%;display:flex;align-items:center;justify-content:center;">✕</button>
                </div>
                <div style="display:grid;gap:16px;">
                    <div style="background:var(--surface);padding:14px;border-radius:10px;">
                        <p style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">CUSTOMER</p>
                        <p style="font-weight:600;">${o.customerName}</p>
                        <p style="font-size:13px;">${o.customerPhone}</p>
                        <p style="font-size:13px;color:var(--text-secondary);">${o.address}${o.landmark ? ', ' + o.landmark : ''}, ${o.pincode}</p>
                    </div>
                    <div style="background:var(--surface);padding:14px;border-radius:10px;">
                        <p style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">ITEMS</p>
                        ${o.items
                          .map(
                            (
                              i,
                            ) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
                            <span style="font-size:13px;">${i.name} × ${i.quantity}</span>
                            <strong>₹${i.price * i.quantity}</strong>
                        </div>`,
                          )
                          .join('')}
                        <div style="display:flex;justify-content:space-between;padding:10px 0 4px;"><span>Item Total</span><span>₹${o.itemTotal}</span></div>
                        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Delivery</span><span>₹${o.deliveryFee}</span></div>
                        ${o.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:var(--accent);"><span>Discount</span><span>-₹${o.discount}</span></div>` : ''}
                        <div style="display:flex;justify-content:space-between;padding:8px 0 0;font-weight:700;font-size:15px;border-top:1px solid var(--border);margin-top:4px;"><span>Total</span><span>₹${o.totalAmount}</span></div>
                    </div>
                    <div style="background:var(--surface);padding:14px;border-radius:10px;">
                        <p style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">STATUS HISTORY</p>
                        ${o.statusHistory
                          .map(
                            (
                              h,
                            ) => `<div style="display:flex;gap:10px;padding:5px 0;">
                            <span style="font-size:12px;color:var(--text-muted);white-space:nowrap;">${new Date(h.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            ${orderStatusBadge(h.status)}
                            ${h.note ? `<span style="font-size:12px;color:var(--text-muted);">${h.note}</span>` : ''}
                        </div>`,
                          )
                          .join('')}
                    </div>
                </div>
            </div>`
      document.body.appendChild(modal)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove()
      })
    })
    .catch((err) => showToast('Could not load order: ' + err.message, 'error'))
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — CATEGORIES (full CRUD with product-count guard)
// ─────────────────────────────────────────────────────────────────

async function renderAdminCategories(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <h4 id="cat-count-label">Categories</h4>
                <button class="btn btn-primary" onclick="showCategoryForm(null)" style="width:auto;padding:8px 16px;">+ Add Category</button>
            </div>
            <div class="admin-card-body" style="padding:0;" id="cat-table-body">
                <div style="padding:40px;text-align:center;color:var(--text-muted);">Loading...</div>
            </div>
        </div>`
  loadCategories()
}

async function loadCategories() {
  const body = document.getElementById('cat-table-body')
  if (!body) return
  try {
    const [catRes, prodRes] = await Promise.all([
      api('/categories/admin'),
      api('/products/admin?limit=200'),
    ])
    const cats = catRes.data
    const prodCountMap = {}
    prodRes.data.forEach((p) => {
      prodCountMap[p.category] = (prodCountMap[p.category] || 0) + 1
    })
    const label = document.getElementById('cat-count-label')
    if (label) label.textContent = `Categories (${cats.length})`
    body.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Category</th><th>Description</th><th>Subcategories</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${cats
                  .map((c) => {
                    const pc = prodCountMap[c.id] || 0
                    return `<tr>
                        <td><div class="product-cell">
                            <img src="${c.image || 'https://via.placeholder.com/40'}" class="product-image" onerror="this.src='https://via.placeholder.com/40'">
                            <div><strong style="font-size:13px;">${c.name}</strong><div style="font-size:11px;color:var(--text-muted);">ID: ${c.id}</div></div>
                        </div></td>
                        <td style="font-size:13px;max-width:200px;">${c.description || '—'}</td>
                        <td>${c.subcategories?.length || 0}</td>
                        <td><span style="font-weight:600;color:${pc > 0 ? 'var(--accent)' : 'var(--text-muted)'};">${pc}</span></td>
                        <td><span style="background:${c.isActive ? 'var(--accent-light)' : '#FEE2E2'};color:${c.isActive ? 'var(--accent)' : 'var(--error)'};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;">${c.isActive ? 'Active' : 'Hidden'}</span></td>
                        <td><div class="admin-actions">
                            <button class="admin-action-btn edit" title="Edit" onclick="showCategoryForm('${c.id}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="admin-action-btn delete" title="${pc > 0 ? 'Cannot delete — has products' : 'Delete'}"
                                onclick="deleteCategory('${c.id}','${c.name.replace(/'/g, "\\'")}',${pc})"
                                style="${pc > 0 ? 'opacity:0.4;cursor:not-allowed;' : ''}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                        </div></td>
                    </tr>`
                  })
                  .join('')}
                </tbody>
            </table>`
  } catch (err) {
    body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--error);">${err.message}</div>`
  }
}

async function showCategoryForm(catId) {
  let cat = null
  if (catId) {
    try {
      const r = await api(`/categories/${catId}`)
      cat = r.data
    } catch (e) {}
  }
  const isEdit = !!cat
  const c = cat || {}
  document.getElementById('cat-form-modal')?.remove()
  const modal = document.createElement('div')
  modal.id = 'cat-form-modal'
  modal.style.cssText =
    'position:fixed;inset:0;z-index:600;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px;background:rgba(0,0,0,0.5);'
  modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:560px;margin:auto;overflow:hidden;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border);background:var(--surface);">
                <h3 style="font-size:17px;font-weight:700;">${isEdit ? 'Edit Category' : 'Add New Category'}</h3>
                <button onclick="document.getElementById('cat-form-modal').remove()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--surface-dark);border-radius:50%;">✕</button>
            </div>
            <div style="padding:24px;display:flex;flex-direction:column;gap:16px;">
                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Category ID * ${isEdit ? '<span style="font-size:11px;color:var(--text-muted);">(cannot change)</span>' : ''}</label>
                        <input type="text" id="cf-id" value="${c.id || ''}" placeholder="e.g. fish" ${isEdit ? 'disabled style="background:var(--surface);color:var(--text-muted);"' : ''}>
                    </div>
                    <div class="form-group">
                        <label>Display Name *</label>
                        <input type="text" id="cf-name" value="${c.name || ''}" placeholder="e.g. Fish & Seafood">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="cf-desc" value="${c.description || ''}" placeholder="e.g. No added chemicals">
                </div>
                <div class="form-group">
                    <label>Image URL (small — for category card)</label>
                    <input type="text" id="cf-image" value="${c.image || ''}" placeholder="https://i.ibb.co/..." oninput="previewCatImage(this.value,'cf-img-prev')">
                    <img id="cf-img-prev" src="${c.image || ''}" style="margin-top:8px;width:80px;height:80px;object-fit:cover;border-radius:10px;border:1px solid var(--border);${c.image ? '' : 'display:none;'}" onerror="this.style.display='none'">
                </div>
                <div class="form-group">
                    <label>Hero Image URL (large — for category page banner)</label>
                    <input type="text" id="cf-hero" value="${c.heroImage || ''}" placeholder="https://i.ibb.co/..." oninput="previewCatImage(this.value,'cf-hero-prev')">
                    <img id="cf-hero-prev" src="${c.heroImage || ''}" style="margin-top:8px;width:100%;height:80px;object-fit:cover;border-radius:10px;border:1px solid var(--border);${c.heroImage ? '' : 'display:none;'}" onerror="this.style.display='none'">
                </div>
                <div class="form-group">
                    <label>Subcategories <span style="font-size:11px;color:var(--text-muted);">— one per line as: id|Name|ImageURL</span></label>
                    <textarea id="cf-subs" rows="4" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;font-family:monospace;resize:vertical;"
                        placeholder="freshwater|Freshwater Fish|https://...&#10;seawater|Seawater Fish|https://...">${(c.subcategories || []).map((s) => `${s.id}|${s.name}|${s.image || ''}`).join('\n')}</textarea>
                </div>
                <div id="cf-error" style="color:var(--error);font-size:13px;display:none;padding:10px;background:#FEE2E2;border-radius:8px;"></div>
                <div style="display:flex;gap:12px;">
                    <button onclick="document.getElementById('cat-form-modal').remove()" style="flex:1;padding:13px;border:1px solid var(--border);border-radius:10px;font-size:14px;font-weight:600;background:white;cursor:pointer;">Cancel</button>
                    <button onclick="saveCategory(${isEdit ? `'${catId}'` : 'null'})" id="cf-save-btn" style="flex:2;padding:13px;background:var(--primary);color:white;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">${isEdit ? 'Save Changes' : 'Add Category'}</button>
                </div>
            </div>
        </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove()
  })
}

function previewCatImage(url, previewId) {
  const img = document.getElementById(previewId)
  if (!img) return
  if (url) {
    img.src = url
    img.style.display = 'block'
  } else img.style.display = 'none'
}

async function saveCategory(catId) {
  const btn = document.getElementById('cf-save-btn')
  const errEl = document.getElementById('cf-error')
  errEl.style.display = 'none'
  const id = document.getElementById('cf-id')?.value.trim().toLowerCase()
  const name = document.getElementById('cf-name')?.value.trim()
  if (!id || !name) {
    errEl.textContent = 'ID and Name are required'
    errEl.style.display = 'block'
    return
  }
  const subsRaw = document
    .getElementById('cf-subs')
    ?.value.trim()
    .split('\n')
    .filter(Boolean)
  const subcategories = subsRaw
    .map((line) => {
      const [sid, sname, simage] = line.split('|').map((x) => x.trim())
      return { id: sid, name: sname, image: simage || '' }
    })
    .filter((s) => s.id && s.name)
  const payload = {
    id,
    name,
    description: document.getElementById('cf-desc')?.value.trim() || '',
    image: document.getElementById('cf-image')?.value.trim() || '',
    heroImage: document.getElementById('cf-hero')?.value.trim() || '',
    subcategories,
  }
  btn.textContent = catId ? 'Saving...' : 'Adding...'
  btn.disabled = true
  try {
    if (catId)
      await api(`/categories/${catId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    else
      await api('/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    document.getElementById('cat-form-modal').remove()
    showToast(catId ? 'Category updated' : 'Category created', 'success')
    loadCategories()
    loadLiveData()
  } catch (err) {
    errEl.textContent = err.message
    errEl.style.display = 'block'
    btn.textContent = catId ? 'Save Changes' : 'Add Category'
    btn.disabled = false
  }
}

async function deleteCategory(catId, name, productCount) {
  if (productCount > 0) {
    showToast(
      `Cannot delete: ${productCount} products still in this category`,
      'error',
    )
    return
  }
  if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return
  try {
    await api(`/categories/${catId}`, { method: 'DELETE' })
    showToast('Category deleted', 'success')
    loadCategories()
    loadLiveData()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — ANALYTICS / REPORTS
// ─────────────────────────────────────────────────────────────────

let _reportPeriod = 'month'
let _categoryChart = null

async function renderAdminReports(container) {
  container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <h3 style="font-size:18px;font-weight:700;">Analytics</h3>
            <div style="display:flex;gap:6px;">
                ${['today', 'week', 'month', 'year', 'all']
                  .map(
                    (p) => `
                    <button onclick="changeReportPeriod('${p}')" id="rep-period-${p}"
                        style="padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;
                               border:1.5px solid ${_reportPeriod === p ? 'var(--primary)' : 'var(--border)'};
                               background:${_reportPeriod === p ? 'var(--primary)' : 'white'};
                               color:${_reportPeriod === p ? 'white' : 'var(--text-secondary)'};">
                        ${p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>`,
                  )
                  .join('')}
            </div>
        </div>
        <div class="admin-stats" id="rep-stats"><div style="grid-column:1/-1;height:80px;background:var(--surface-dark);border-radius:8px;"></div></div>
        <div class="admin-grid" style="margin-top:24px;">
            <div class="admin-card">
                <div class="admin-card-header"><h4>Revenue Trend</h4></div>
                <div class="admin-card-body"><div style="position:relative;height:280px;"><canvas id="rep-revenue-chart"></canvas></div></div>
            </div>
            <div class="admin-card">
                <div class="admin-card-header"><h4>Category Revenue Split</h4></div>
                <div class="admin-card-body"><div style="position:relative;height:280px;"><canvas id="rep-cat-chart"></canvas></div></div>
            </div>
        </div>
        <div class="admin-card" style="margin-top:24px;">
            <div class="admin-card-header"><h4>Top Products by Revenue</h4></div>
            <div class="admin-card-body" style="padding:0;" id="rep-top-table">
                <div style="height:80px;background:var(--surface-dark);margin:16px;border-radius:8px;"></div>
            </div>
        </div>`
  loadReportData()
}

async function changeReportPeriod(p) {
  _reportPeriod = p
  ;['today', 'week', 'month', 'year', 'all'].forEach((x) => {
    const btn = document.getElementById(`rep-period-${x}`)
    if (!btn) return
    const a = x === p
    btn.style.background = a ? 'var(--primary)' : 'white'
    btn.style.color = a ? 'white' : 'var(--text-secondary)'
    btn.style.borderColor = a ? 'var(--primary)' : 'var(--border)'
  })
  loadReportData()
}

let _repChart = null

async function loadReportData() {
  try {
    const [sumRes, chartRes, topRes, catRes] = await Promise.all([
      api(`/analytics/summary?period=${_reportPeriod}`),
      api(`/analytics/revenue-chart?period=${_reportPeriod}`),
      api(`/analytics/top-products?period=${_reportPeriod}&limit=10`),
      api(`/analytics/category-breakdown?period=${_reportPeriod}`),
    ])
    const s = sumRes.data
    document.getElementById('rep-stats').innerHTML = `
            <div class="stat-card"><p class="label">Revenue</p><p class="value">₹${s.revenue.toLocaleString('en-IN')}</p></div>
            <div class="stat-card"><p class="label">Orders</p><p class="value">${s.orders}</p></div>
            <div class="stat-card"><p class="label">Avg Order</p><p class="value">₹${s.avgOrder.toLocaleString('en-IN')}</p></div>
            <div class="stat-card"><p class="label">New Customers</p><p class="value">${s.newCustomers}</p></div>`

    if (window.Chart) {
      // Revenue trend
      const rc = document.getElementById('rep-revenue-chart')
      if (rc) {
        if (_repChart) _repChart.destroy()
        _repChart = new Chart(rc, {
          type: 'line',
          data: {
            labels: chartRes.data.map((d) => d.label),
            datasets: [
              {
                label: 'Revenue',
                data: chartRes.data.map((d) => d.revenue),
                borderColor: '#D9232E',
                backgroundColor: 'rgba(217,35,46,0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                grid: { display: false },
                ticks: { maxTicksLimit: 10, font: { size: 11 } },
              },
              y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                  callback: (v) =>
                    '₹' + (v >= 1000 ? Math.round(v / 1000) + 'K' : v),
                  font: { size: 11 },
                },
              },
            },
          },
        })
      }
      // Category doughnut
      const cc = document.getElementById('rep-cat-chart')
      if (cc && catRes.data.length) {
        if (_categoryChart) _categoryChart.destroy()
        const palette = [
          '#D9232E',
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#F97316',
          '#06B6D4',
          '#EC4899',
        ]
        _categoryChart = new Chart(cc, {
          type: 'doughnut',
          data: {
            labels: catRes.data.map((d) => d._id),
            datasets: [
              {
                data: catRes.data.map((d) => Math.round(d.revenue)),
                backgroundColor: palette,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: { font: { size: 12 }, padding: 12 },
              },
            },
          },
        })
      }
    }

    // Top products table
    document.getElementById('rep-top-table').innerHTML = `
            <table class="admin-table">
                <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                <tbody>${topRes.data
                  .map(
                    (p, i) => `
                    <tr>
                        <td style="font-weight:700;color:${i < 3 ? 'var(--primary)' : 'var(--text-muted)'};">${i + 1}</td>
                        <td>${p._id}</td>
                        <td>${p.unitsSold}</td>
                        <td><strong>₹${Math.round(p.revenue).toLocaleString('en-IN')}</strong></td>
                    </tr>`,
                  )
                  .join('')}
                </tbody>
            </table>`
  } catch (err) {
    document.getElementById('rep-stats').innerHTML =
      `<div style="grid-column:1/-1;padding:20px;color:var(--error);">${err.message}</div>`
  }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — COUPONS
// ─────────────────────────────────────────────────────────────────

async function renderAdminHero(container) {
  container.innerHTML = `
        <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid var(--border);">
            <button onclick="showHeroTab('banners')" id="tab-banners" style="padding:10px 18px;border:none;border-bottom:2px solid var(--primary);font-size:14px;font-weight:700;color:var(--primary);background:none;cursor:pointer;">🖼 Banners</button>
            <button onclick="showHeroTab('coupons')" id="tab-coupons" style="padding:10px 18px;border:none;border-bottom:2px solid transparent;font-size:14px;font-weight:600;color:var(--text-secondary);background:none;cursor:pointer;">🎟 Coupons</button>
            <button onclick="showHeroTab('settings')" id="tab-settings" style="padding:10px 18px;border:none;border-bottom:2px solid transparent;font-size:14px;font-weight:600;color:var(--text-secondary);background:none;cursor:pointer;">⚙️ Settings</button>
        </div>
        <div id="banners-panel"></div>
        <div id="coupons-panel" style="display:none;"></div>
        <div id="settings-panel" style="display:none;"></div>`
  showHeroTab('banners')
}

function showHeroTab(tab) {
  ;['banners', 'coupons', 'settings'].forEach((t) => {
    const panel = document.getElementById(`${t}-panel`)
    const btn = document.getElementById(`tab-${t}`)
    if (!panel || !btn) return
    const active = t === tab
    panel.style.display = active ? 'block' : 'none'
    btn.style.borderBottomColor = active ? 'var(--primary)' : 'transparent'
    btn.style.color = active ? 'var(--primary)' : 'var(--text-secondary)'
    btn.style.fontWeight = active ? '700' : '600'
  })
  if (tab === 'banners') loadHeroBanners()
  if (tab === 'coupons') loadCoupons()
  if (tab === 'settings') loadSettingsPanel()
}

// Alias for backward compat
function showCouponTab() {
  showHeroTab('coupons')
}
function showSettingsTab() {
  showHeroTab('settings')
}

async function loadHeroBanners() {
  const panel = document.getElementById('banners-panel')
  panel.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <h4>Hero Banners</h4>
                <button class="btn btn-primary" onclick="showBannerForm(null)" style="width:auto;padding:8px 16px;">+ Add Banner</button>
            </div>
            <div class="admin-card-body" id="banners-body">
                <div style="padding:30px;text-align:center;color:var(--text-muted);">Loading...</div>
            </div>
        </div>`
  try {
    const res = await api('/hero/admin')
    const banners = res.data
    document.getElementById('banners-body').innerHTML = banners.length
      ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
                ${banners
                  .map(
                    (b) => `
                    <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;${!b.isActive ? 'opacity:0.55;' : ''}">
                        <div style="position:relative;height:140px;">
                            <img src="${b.image}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.background='var(--surface)'">
                            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7),transparent);padding:14px;display:flex;flex-direction:column;justify-content:flex-end;color:white;">
                                ${b.badge ? `<span style="font-size:10px;background:var(--primary);padding:2px 8px;border-radius:10px;width:fit-content;margin-bottom:4px;">${b.badge}</span>` : ''}
                                <h4 style="font-size:15px;font-weight:700;margin:0;">${b.title}</h4>
                                <p style="font-size:12px;opacity:0.85;margin:2px 0 0;">${b.subtitle || ''}</p>
                            </div>
                            ${!b.isActive ? `<div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:white;font-size:10px;padding:3px 8px;border-radius:10px;">Hidden</div>` : ''}
                        </div>
                        <div style="padding:12px;display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-size:12px;color:var(--text-muted);">→ ${b.linkType} · ${b.linkId || 'none'}</span>
                            <div class="admin-actions">
                                <button class="admin-action-btn edit" onclick="showBannerForm('${b._id}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="admin-action-btn" onclick="toggleBanner('${b._id}')" title="${b.isActive ? 'Hide' : 'Show'}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:${b.isActive ? 'var(--warning)' : 'var(--accent)'};">
                                        ${
                                          b.isActive
                                            ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                                            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                                        }
                                    </svg>
                                </button>
                                <button class="admin-action-btn delete" onclick="deleteBanner('${b._id}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>`,
                  )
                  .join('')}
            </div>`
      : `<div style="padding:40px;text-align:center;color:var(--text-muted);">No banners yet. Add your first one!</div>`
  } catch (err) {
    document.getElementById('banners-body').innerHTML =
      `<div style="padding:20px;color:var(--error);">${err.message}</div>`
  }
}

async function showBannerForm(bannerId) {
  let banner = null
  if (bannerId) {
    try {
      const res = await api(`/hero/admin`)
      banner = res.data.find((b) => b._id === bannerId)
    } catch {}
  }
  const b = banner || {}
  document.getElementById('banner-form-modal')?.remove()
  const modal = document.createElement('div')
  modal.id = 'banner-form-modal'
  modal.style.cssText =
    'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);overflow-y:auto;'
  modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:500px;overflow:hidden;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);background:var(--surface);">
                <h3 style="font-size:17px;font-weight:700;">${bannerId ? 'Edit Banner' : 'Add Banner'}</h3>
                <button onclick="document.getElementById('banner-form-modal').remove()" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:var(--surface-dark);border-radius:50%;">✕</button>
            </div>
            <div style="padding:22px;display:flex;flex-direction:column;gap:14px;">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="bf-title" value="${b.title || ''}" placeholder="e.g. Fresh Tiger Prawns">
                </div>
                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Subtitle</label>
                        <input type="text" id="bf-subtitle" value="${b.subtitle || ''}" placeholder="Ocean fresh delicacies">
                    </div>
                    <div class="form-group">
                        <label>Badge text</label>
                        <input type="text" id="bf-badge" value="${b.badge || ''}" placeholder="Fresh Today">
                    </div>
                </div>
                <div class="form-group">
                    <label>Image URL * <span style="font-size:11px;color:var(--text-muted);">Upload to imgbb.com → paste link</span></label>
                    <input type="text" id="bf-image" value="${b.image || ''}" placeholder="https://i.ibb.co/..." oninput="document.getElementById('bf-img-prev').src=this.value">
                    <img id="bf-img-prev" src="${b.image || ''}" style="margin-top:8px;width:100%;height:100px;object-fit:cover;border-radius:8px;border:1px solid var(--border);${b.image ? '' : 'display:none;'}" onerror="this.style.display='none'">
                </div>
                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Links to</label>
                        <select id="bf-linktype" style="width:100%;padding:11px;border:1.5px solid var(--border);border-radius:8px;">
                            <option value="category" ${b.linkType === 'category' ? 'selected' : ''}>Category</option>
                            <option value="product"  ${b.linkType === 'product' ? 'selected' : ''}>Product</option>
                            <option value="none"     ${b.linkType === 'none' ? 'selected' : ''}>No link</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Category / Product ID</label>
                        <input type="text" id="bf-linkid" value="${b.linkId || ''}" placeholder="e.g. prawns">
                    </div>
                </div>
                <div class="form-group">
                    <label>Sort Order <span style="font-size:11px;color:var(--text-muted);">lower = shown first</span></label>
                    <input type="number" id="bf-order" value="${b.sortOrder || 0}" min="0">
                </div>
                <div id="bf-error" style="color:var(--error);font-size:13px;display:none;padding:10px;background:#FEE2E2;border-radius:8px;"></div>
                <div style="display:flex;gap:12px;">
                    <button onclick="document.getElementById('banner-form-modal').remove()" style="flex:1;padding:12px;border:1px solid var(--border);border-radius:10px;font-size:14px;background:white;cursor:pointer;">Cancel</button>
                    <button onclick="saveBanner(${bannerId ? `'${bannerId}'` : 'null'})" id="bf-save-btn" style="flex:2;padding:12px;background:var(--primary);color:white;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">${bannerId ? 'Save Changes' : 'Add Banner'}</button>
                </div>
            </div>
        </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove()
  })
}

async function saveBanner(bannerId) {
  const btn = document.getElementById('bf-save-btn')
  const errEl = document.getElementById('bf-error')
  errEl.style.display = 'none'
  const title = document.getElementById('bf-title')?.value.trim()
  const image = document.getElementById('bf-image')?.value.trim()
  if (!title || !image) {
    errEl.textContent = 'Title and image are required'
    errEl.style.display = 'block'
    return
  }
  const payload = {
    title,
    image,
    subtitle: document.getElementById('bf-subtitle')?.value.trim() || '',
    badge: document.getElementById('bf-badge')?.value.trim() || '',
    linkType: document.getElementById('bf-linktype')?.value || 'category',
    linkId: document.getElementById('bf-linkid')?.value.trim() || '',
    sortOrder: parseInt(document.getElementById('bf-order')?.value) || 0,
  }
  btn.textContent = 'Saving...'
  btn.disabled = true
  try {
    if (bannerId)
      await api(`/hero/${bannerId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    else await api('/hero', { method: 'POST', body: JSON.stringify(payload) })
    document.getElementById('banner-form-modal').remove()
    showToast(bannerId ? 'Banner updated' : 'Banner added', 'success')
    loadHeroBanners()
    loadLiveBanners()
  } catch (err) {
    errEl.textContent = err.message
    errEl.style.display = 'block'
    btn.textContent = bannerId ? 'Save Changes' : 'Add Banner'
    btn.disabled = false
  }
}

async function toggleBanner(id) {
  try {
    await api(`/hero/${id}/toggle`, { method: 'PATCH' })
    loadHeroBanners()
    loadLiveBanners()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function deleteBanner(id) {
  if (!confirm('Delete this banner?')) return
  try {
    await api(`/hero/${id}`, { method: 'DELETE' })
    showToast('Banner deleted', 'success')
    loadHeroBanners()
    loadLiveBanners()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// Load live banners and update the hero slider
async function loadLiveBanners() {
  try {
    const res = await api('/hero')
    if (res.success && res.data.length) {
      // Update appData and re-init slider
      window.appData.heroBanners = res.data
      const slider = document.querySelector('.hero-section')
      if (slider) rebuildHeroSlider(res.data)
    }
  } catch {}
}

function rebuildHeroSlider(banners) {
  const section = document.getElementById('hero-section')
  if (!section) return
  const dotsEl = section.querySelector('.hero-dots')
  // Remove old slides
  section.querySelectorAll('.hero-slide').forEach((el) => el.remove())
  // Add new slides
  banners.forEach((b, i) => {
    const slide = document.createElement('div')
    slide.className = `hero-slide${i === 0 ? ' active' : ''}`
    slide.dataset.link = b.linkType
    slide.dataset.id = b.linkId
    slide.innerHTML = `
            <img src="${b.image}" alt="${b.title}" class="hero-image">
            <div class="hero-overlay">
                ${b.badge ? `<span class="hero-badge">${b.badge}</span>` : ''}
                <h2 class="hero-title">${b.title}</h2>
                ${b.subtitle ? `<p class="hero-subtitle">${b.subtitle}</p>` : ''}
            </div>`
    section.insertBefore(slide, dotsEl)
  })
  // Rebuild dots
  if (dotsEl) {
    dotsEl.innerHTML = banners
      .map(
        (_, i) =>
          `<span class="dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`,
      )
      .join('')
  }
  state.heroSlideIndex = 0
  initHeroSlider()
}
document.getElementById('coupons-panel').style.display = 'block'
document.getElementById('settings-panel').style.display = 'none'
document.getElementById('tab-coupons').style.borderBottomColor =
  'var(--primary)'
document.getElementById('tab-coupons').style.color = 'var(--primary)'
document.getElementById('tab-settings').style.borderBottomColor = 'transparent'
document.getElementById('tab-settings').style.color = 'var(--text-secondary)'
loadCoupons()

function showSettingsTab() {
  document.getElementById('coupons-panel').style.display = 'none'
  document.getElementById('settings-panel').style.display = 'block'
  document.getElementById('tab-settings').style.borderBottomColor =
    'var(--primary)'
  document.getElementById('tab-settings').style.color = 'var(--primary)'
  document.getElementById('tab-coupons').style.borderBottomColor = 'transparent'
  document.getElementById('tab-coupons').style.color = 'var(--text-secondary)'
  loadSettingsPanel()
}

async function loadCoupons() {
  const panel = document.getElementById('coupons-panel')
  panel.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <h4 id="coupon-count-label">Coupons</h4>
                <button class="btn btn-primary" onclick="showCouponForm(null)" style="width:auto;padding:8px 16px;">+ New Coupon</button>
            </div>
            <div class="admin-card-body" style="padding:0;" id="coupon-table-body">
                <div style="padding:40px;text-align:center;color:var(--text-muted);">Loading...</div>
            </div>
        </div>`
  try {
    const res = await api('/coupons')
    const label = document.getElementById('coupon-count-label')
    if (label) label.textContent = `Coupons (${res.data.length})`
    document.getElementById('coupon-table-body').innerHTML = res.data.length
      ? `
            <table class="admin-table">
                <thead><tr><th>Code</th><th>Type</th><th>Discount</th><th>Min Order</th><th>Uses</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${res.data
                  .map(
                    (c) => `
                    <tr>
                        <td><strong style="font-family:monospace;font-size:13px;background:var(--surface);padding:3px 8px;border-radius:6px;">${c.code}</strong></td>
                        <td style="font-size:12px;">${c.type}</td>
                        <td><strong>${c.type === 'percentage' ? c.discount + '%' : '₹' + c.discount}</strong>${c.maxDiscount > 0 && c.type === 'percentage' ? `<span style="font-size:11px;color:var(--text-muted);"> (max ₹${c.maxDiscount})</span>` : ''}</td>
                        <td style="font-size:13px;">₹${c.minOrder || 0}</td>
                        <td style="font-size:13px;">${c.usedCount}${c.maxUses > 0 ? '/' + c.maxUses : ' / ∞'}</td>
                        <td style="font-size:12px;color:var(--text-muted);">${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'No expiry'}</td>
                        <td><label style="cursor:pointer;display:flex;align-items:center;gap:6px;">
                            <input type="checkbox" ${c.isActive ? 'checked' : ''} onchange="toggleCoupon('${c._id}')" style="width:16px;height:16px;">
                            <span class="status ${c.isActive ? 'in-stock' : 'out-of-stock'}">${c.isActive ? 'Active' : 'Off'}</span>
                        </label></td>
                        <td><div class="admin-actions">
                            <button class="admin-action-btn edit" onclick="showCouponForm('${c._id}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="admin-action-btn delete" onclick="deleteCoupon('${c._id}','${c.code}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                        </div></td>
                    </tr>`,
                  )
                  .join('')}
                </tbody>
            </table>`
      : `<div style="padding:40px;text-align:center;color:var(--text-muted);">No coupons yet. Create your first one!</div>`
  } catch (err) {
    document.getElementById('coupon-table-body').innerHTML =
      `<div style="padding:20px;color:var(--error);">${err.message}</div>`
  }
}

async function showCouponForm(couponId) {
  let coupon = null
  if (couponId) {
    try {
      const r = await api('/coupons')
      coupon = r.data.find((c) => c._id === couponId)
    } catch (e) {}
  }
  const c = coupon || {}
  document.getElementById('coup-form-modal')?.remove()
  const modal = document.createElement('div')
  modal.id = 'coup-form-modal'
  modal.style.cssText =
    'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);overflow-y:auto;'
  modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:480px;overflow:hidden;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);background:var(--surface);">
                <h3 style="font-size:17px;font-weight:700;">${couponId ? 'Edit Coupon' : 'New Coupon'}</h3>
                <button onclick="document.getElementById('coup-form-modal').remove()" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:var(--surface-dark);border-radius:50%;">✕</button>
            </div>
            <div style="padding:22px;display:flex;flex-direction:column;gap:14px;">
                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Coupon Code *</label>
                        <input type="text" id="coup-code" value="${c.code || ''}" placeholder="FRESH20" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()">
                    </div>
                    <div class="form-group">
                        <label>Type *</label>
                        <select id="coup-type" style="width:100%;padding:11px;border:1.5px solid var(--border);border-radius:8px;">
                            <option value="percentage" ${c.type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
                            <option value="flat" ${c.type === 'flat' ? 'selected' : ''}>Flat Amount (₹)</option>
                        </select>
                    </div>
                </div>
                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Discount Value *</label>
                        <input type="number" id="coup-discount" value="${c.discount || ''}" placeholder="20" min="0">
                    </div>
                    <div class="form-group">
                        <label>Max Discount (₹) <span style="font-size:11px;color:var(--text-muted);">0 = unlimited</span></label>
                        <input type="number" id="coup-maxdiscount" value="${c.maxDiscount || 0}" placeholder="200" min="0">
                    </div>
                </div>
                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Min Order (₹)</label>
                        <input type="number" id="coup-minorder" value="${c.minOrder || 0}" placeholder="500" min="0">
                    </div>
                    <div class="form-group">
                        <label>Max Uses <span style="font-size:11px;color:var(--text-muted);">0 = unlimited</span></label>
                        <input type="number" id="coup-maxuses" value="${c.maxUses || 0}" placeholder="100" min="0">
                    </div>
                </div>
                <div class="admin-form-row">
                    <div class="form-group">
                        <label>Expiry Date <span style="font-size:11px;color:var(--text-muted);">leave blank = no expiry</span></label>
                        <input type="date" id="coup-expiry" value="${c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="coup-desc" value="${c.description || ''}" placeholder="20% off up to ₹200">
                    </div>
                </div>
                <div id="coup-error" style="color:var(--error);font-size:13px;display:none;padding:10px;background:#FEE2E2;border-radius:8px;"></div>
                <div style="display:flex;gap:12px;">
                    <button onclick="document.getElementById('coup-form-modal').remove()" style="flex:1;padding:12px;border:1px solid var(--border);border-radius:10px;font-size:14px;background:white;cursor:pointer;">Cancel</button>
                    <button onclick="saveCoupon(${couponId ? `'${couponId}'` : 'null'})" id="coup-save-btn" style="flex:2;padding:12px;background:var(--primary);color:white;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">${couponId ? 'Save Changes' : 'Create Coupon'}</button>
                </div>
            </div>
        </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove()
  })
}

async function saveCoupon(couponId) {
  const btn = document.getElementById('coup-save-btn')
  const errEl = document.getElementById('coup-error')
  errEl.style.display = 'none'
  const code = document.getElementById('coup-code')?.value.trim().toUpperCase()
  const type = document.getElementById('coup-type')?.value
  const discount = parseFloat(document.getElementById('coup-discount')?.value)
  if (!code || !type || isNaN(discount)) {
    errEl.textContent = 'Code, type and discount are required'
    errEl.style.display = 'block'
    return
  }
  const expiry = document.getElementById('coup-expiry')?.value
  const payload = {
    code,
    type,
    discount,
    maxDiscount:
      parseFloat(document.getElementById('coup-maxdiscount')?.value) || 0,
    minOrder: parseFloat(document.getElementById('coup-minorder')?.value) || 0,
    maxUses: parseInt(document.getElementById('coup-maxuses')?.value) || 0,
    description: document.getElementById('coup-desc')?.value.trim() || '',
    expiresAt: expiry || null,
  }
  btn.textContent = 'Saving...'
  btn.disabled = true
  try {
    if (couponId)
      await api(`/coupons/${couponId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    else
      await api('/coupons', { method: 'POST', body: JSON.stringify(payload) })
    document.getElementById('coup-form-modal').remove()
    showToast(couponId ? 'Coupon updated' : 'Coupon created', 'success')
    loadCoupons()
  } catch (err) {
    errEl.textContent = err.message
    errEl.style.display = 'block'
    btn.textContent = couponId ? 'Save Changes' : 'Create Coupon'
    btn.disabled = false
  }
}

async function toggleCoupon(id) {
  try {
    await api(`/coupons/${id}/toggle`, { method: 'PATCH' })
    showToast('Coupon toggled', 'success')
    loadCoupons()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function deleteCoupon(id, code) {
  if (!confirm(`Delete coupon "${code}"?`)) return
  try {
    await api(`/coupons/${id}`, { method: 'DELETE' })
    showToast('Coupon deleted', 'success')
    loadCoupons()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — STORE SETTINGS
// ─────────────────────────────────────────────────────────────────

async function loadSettingsPanel() {
  const panel = document.getElementById('settings-panel')
  panel.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading settings...</div>`
  try {
    const res = await api('/settings/admin')
    const s = res.data
    panel.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header"><h4>Store Settings</h4></div>
                <div class="admin-card-body" style="display:flex;flex-direction:column;gap:20px;">
                    <div style="background:var(--surface);border-radius:12px;padding:16px;">
                        <p style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:14px;">🚚 DELIVERY FEES</p>
                        <div class="admin-form-row">
                            <div class="form-group"><label>Standard Delivery (₹)</label><input type="number" id="set-std" value="${s.standardDeliveryFee}" min="0"></div>
                            <div class="form-group"><label>Express Delivery (₹)</label><input type="number" id="set-exp" value="${s.expressDeliveryFee}" min="0"></div>
                        </div>
                        <div class="admin-form-row">
                            <div class="form-group"><label>Scheduled Delivery (₹)</label><input type="number" id="set-sch" value="${s.scheduledDeliveryFee}" min="0"></div>
                            <div class="form-group">
                                <label>Free Delivery Above (₹) <span style="font-size:11px;color:var(--text-muted);">0 = never free</span></label>
                                <input type="number" id="set-free" value="${s.freeDeliveryThreshold}" min="0">
                            </div>
                        </div>
                        <div style="background:#E8F5E9;border-radius:8px;padding:10px 14px;font-size:12px;color:#2E7D32;margin-top:4px;">
                            💡 Currently: Orders above ₹<span id="free-preview">${s.freeDeliveryThreshold}</span> get free delivery. Set to 0 to always charge.
                        </div>
                    </div>

                    <div style="background:var(--surface);border-radius:12px;padding:16px;">
                        <p style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:14px;">🏪 STORE CONTROL</p>
                        <div class="admin-form-row">
                            <div class="form-group">
                                <label>Store Status</label>
                                <select id="set-open" style="width:100%;padding:11px;border:1.5px solid var(--border);border-radius:8px;">
                                    <option value="true" ${s.storeOpen ? 'selected' : ''}>Open — accepting orders</option>
                                    <option value="false" ${!s.storeOpen ? 'selected' : ''}>Closed — not accepting orders</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Min Order Amount (₹) <span style="font-size:11px;color:var(--text-muted);">0 = no minimum</span></label>
                                <input type="number" id="set-minorder" value="${s.minOrderAmount || 0}" min="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Closed Message (shown to customers when store is closed)</label>
                            <input type="text" id="set-closed-msg" value="${s.storeClosedMessage || ''}" placeholder="We are closed right now...">
                        </div>
                    </div>

                    <div style="background:var(--surface);border-radius:12px;padding:16px;">
                        <p style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:14px;">📋 DELIVERY SLOTS</p>
                        <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">One slot per line</p>
                        <textarea id="set-slots" rows="5" style="width:100%;padding:11px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;resize:vertical;">${(s.deliverySlots || []).join('\n')}</textarea>
                    </div>

                    <div id="set-error" style="color:var(--error);font-size:13px;display:none;padding:10px;background:#FEE2E2;border-radius:8px;"></div>
                    <button onclick="saveSettings()" id="set-save-btn" style="padding:14px;background:var(--primary);color:white;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">Save All Settings</button>
                </div>
            </div>`

    // Live preview of free delivery threshold
    document.getElementById('set-free')?.addEventListener('input', function () {
      const el = document.getElementById('free-preview')
      if (el) el.textContent = this.value || '0'
    })
  } catch (err) {
    panel.innerHTML = `<div style="padding:20px;color:var(--error);">${err.message}</div>`
  }
}

async function saveSettings() {
  const btn = document.getElementById('set-save-btn')
  const errEl = document.getElementById('set-error')
  errEl.style.display = 'none'
  btn.textContent = 'Saving...'
  btn.disabled = true
  const slots = (document.getElementById('set-slots')?.value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const payload = {
    standardDeliveryFee:
      parseFloat(document.getElementById('set-std')?.value) || 0,
    expressDeliveryFee:
      parseFloat(document.getElementById('set-exp')?.value) || 0,
    scheduledDeliveryFee:
      parseFloat(document.getElementById('set-sch')?.value) || 0,
    freeDeliveryThreshold:
      parseFloat(document.getElementById('set-free')?.value) || 0,
    storeOpen: document.getElementById('set-open')?.value === 'true',
    minOrderAmount:
      parseFloat(document.getElementById('set-minorder')?.value) || 0,
    storeClosedMessage:
      document.getElementById('set-closed-msg')?.value.trim() || '',
    deliverySlots: slots,
  }
  try {
    await api('/settings', { method: 'PUT', body: JSON.stringify(payload) })
    showToast('Settings saved!', 'success')

    // Update local delivery options in app
    window.appData.deliveryOptions = [
      {
        id: 'standard',
        name: 'Standard Delivery',
        description: 'Tomorrow 6AM - 8AM',
        fee: payload.standardDeliveryFee,
      },
      {
        id: 'express',
        name: 'Express Delivery',
        description: 'Get it in 30-60 minutes',
        fee: payload.expressDeliveryFee,
      },
      {
        id: 'scheduled',
        name: 'Scheduled Delivery',
        description: 'Choose your preferred slot',
        fee: payload.scheduledDeliveryFee,
      },
    ]
  } catch (err) {
    errEl.textContent = err.message
    errEl.style.display = 'block'
  }
  btn.textContent = 'Save All Settings'
  btn.disabled = false
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — USERS / CUSTOMERS
// ─────────────────────────────────────────────────────────────────

async function renderAdminUsers(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header" style="flex-wrap:wrap;gap:12px;">
                <h4 id="users-count-label">Customers</h4>
                <input type="text" placeholder="Search by name or phone..." oninput="searchCustomers(this.value)"
                    style="padding:8px 14px;border:1.5px solid var(--border);border-radius:20px;font-size:13px;width:220px;">
            </div>
            <div class="admin-card-body" style="padding:0;" id="users-table-body">
                <div style="padding:40px;text-align:center;color:var(--text-muted);">Loading customers...</div>
            </div>
        </div>`
  loadCustomers()
}

let _custSearchTimer
function searchCustomers(val) {
  clearTimeout(_custSearchTimer)
  _custSearchTimer = setTimeout(() => loadCustomers(val), 350)
}

async function loadCustomers(search = '') {
  const body = document.getElementById('users-table-body')
  if (!body) return
  try {
    const res = await api(
      `/customers?limit=30${search ? '&search=' + encodeURIComponent(search) : ''}`,
    )
    const label = document.getElementById('users-count-label')
    if (label) label.textContent = `Customers (${res.total || res.data.length})`
    body.innerHTML = res.data.length
      ? `
            <table class="admin-table">
                <thead><tr><th>Customer</th><th>Phone</th><th>Joined</th><th>Last Login</th><th>Addresses</th></tr></thead>
                <tbody>${res.data
                  .map(
                    (u) => `
                    <tr>
                        <td><strong>${u.name || '(No name yet)'}</strong></td>
                        <td style="font-family:monospace;font-size:13px;">${u.phone}</td>
                        <td style="font-size:12px;color:var(--text-muted);">${new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style="font-size:12px;color:var(--text-muted);">${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}</td>
                        <td style="font-size:13px;">${u.addresses?.length || 0} saved</td>
                    </tr>`,
                  )
                  .join('')}
                </tbody>
            </table>`
      : `<div style="padding:40px;text-align:center;color:var(--text-muted);">No customers yet</div>`
  } catch (err) {
    body.innerHTML = `<div style="padding:20px;color:var(--error);">${err.message}</div>`
  }
}

// Legacy wrappers kept for any inline references still in HTML
function editProduct(id) {
  showProductForm(id)
}
function toggleProductStock(id) {
  const p = window.appData.products.find((p) => p._id === id || p.id === id)
  if (p) quickToggleStock(id, !p.inStock)
}
function showAddProductForm() {
  showProductForm(null)
}
function confirmOrder(id) {
  updateOrderStatus(id, 'confirmed')
}
function viewOrderDetails(id) {
  viewOrderDetail(id)
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — ISSUE REPORTS
// ─────────────────────────────────────────────────────────────────

let _issueFilter = 'all'

async function renderAdminIssues(container) {
  container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header" style="flex-wrap:wrap;gap:12px;">
                <h4 id="issues-count-label">Issue Reports</h4>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${['all', 'open', 'in_review', 'resolved', 'closed']
                      .map(
                        (s) => `
                        <button onclick="filterIssues('${s}')" id="issue-tab-${s}"
                            style="padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;
                                   border:1.5px solid ${_issueFilter === s ? 'var(--primary)' : 'var(--border)'};
                                   background:${_issueFilter === s ? 'var(--primary)' : 'white'};
                                   color:${_issueFilter === s ? 'white' : 'var(--text-secondary)'};">
                            ${s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                        </button>`,
                      )
                      .join('')}
                </div>
            </div>
            <div class="admin-card-body" style="padding:0;" id="issues-body">
                <div style="padding:40px;text-align:center;color:var(--text-muted);">Loading...</div>
            </div>
        </div>`
  loadIssues()
}

function filterIssues(status) {
  _issueFilter = status
  document.querySelectorAll('[id^="issue-tab-"]').forEach((b) => {
    const active = b.id === `issue-tab-${status}`
    b.style.background = active ? 'var(--primary)' : 'white'
    b.style.color = active ? 'white' : 'var(--text-secondary)'
    b.style.borderColor = active ? 'var(--primary)' : 'var(--border)'
  })
  loadIssues()
}

async function loadIssues() {
  const body = document.getElementById('issues-body')
  if (!body) return
  body.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-muted);">Loading...</div>`
  try {
    const qs = _issueFilter !== 'all' ? `?status=${_issueFilter}` : ''
    const res = await api(`/issues${qs}`)
    const issues = res.data
    const label = document.getElementById('issues-count-label')
    if (label)
      label.textContent = `Issue Reports (${res.total || issues.length})`

    if (!issues.length) {
      body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">No issues found 🎉</div>`
      return
    }

    body.innerHTML = issues
      .map(
        (issue) => `
            <div style="padding:16px 20px;border-bottom:1px solid var(--border);" id="issue-${issue._id}">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                            ${issueBadge(issue.status)}
                            <span style="font-size:12px;background:var(--surface);padding:2px 8px;border-radius:10px;color:var(--text-secondary);">
                                ${issue.issueType.replace('_', ' ')}
                            </span>
                            <span style="font-size:11px;color:var(--text-muted);">${new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style="font-size:14px;font-weight:600;margin:0 0 2px;">${issue.customerName} · ${issue.customerPhone}</p>
                        <p style="font-size:12px;color:var(--text-muted);margin:0 0 6px;">Order: <strong>${issue.orderStringId}</strong></p>
                        <p style="font-size:13px;color:var(--text-primary);margin:0;">${issue.description}</p>
                        ${issue.adminNote ? `<p style="font-size:12px;color:var(--accent);margin-top:6px;background:var(--accent-light);padding:6px 10px;border-radius:6px;">✅ Admin note: ${issue.adminNote}</p>` : ''}
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;min-width:140px;">
                        <select onchange="updateIssueStatus('${issue._id}',this.value)"
                            style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;background:white;cursor:pointer;">
                            <option value="">Update status...</option>
                            <option value="open">Open</option>
                            <option value="in_review">In Review</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                        <button onclick="showIssueNoteModal('${issue._id}')"
                            style="padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;background:white;cursor:pointer;">
                            Add Note
                        </button>
                    </div>
                </div>
            </div>`,
      )
      .join('')
  } catch (err) {
    body.innerHTML = `<div style="padding:20px;color:var(--error);">${err.message}</div>`
  }
}

function issueBadge(status) {
  const map = {
    open: ['#FEE2E2', '#991B1B', 'Open'],
    in_review: ['#FEF3C7', '#92400E', 'In Review'],
    resolved: ['#D1FAE5', '#065F46', 'Resolved'],
    closed: ['#F3F4F6', '#374151', 'Closed'],
  }
  const [bg, col, label] = map[status] || ['#F3F4F6', '#374151', status]
  return `<span style="background:${bg};color:${col};padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700;">${label}</span>`
}

async function updateIssueStatus(issueId, status) {
  if (!status) return
  try {
    await api(`/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    showToast(`Issue → ${status}`, 'success')
    loadIssues()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function showIssueNoteModal(issueId) {
  document.getElementById('issue-note-modal')?.remove()
  const modal = document.createElement('div')
  modal.id = 'issue-note-modal'
  modal.style.cssText =
    'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);'
  modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:380px;padding:22px;">
            <h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">Add Resolution Note</h3>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">This note will be sent to the customer on WhatsApp when the issue is resolved.</p>
            <textarea id="issue-note-text" rows="4" style="width:100%;padding:11px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;resize:vertical;margin-bottom:14px;" placeholder="e.g. We are sorry for the inconvenience. Refund has been processed..."></textarea>
            <div style="display:flex;gap:10px;">
                <button onclick="document.getElementById('issue-note-modal').remove()" style="flex:1;padding:11px;border:1px solid var(--border);border-radius:10px;font-size:14px;background:white;cursor:pointer;">Cancel</button>
                <button onclick="saveIssueNote('${issueId}')" style="flex:2;padding:11px;background:var(--primary);color:white;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Save & Resolve</button>
            </div>
        </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove()
  })
}

async function saveIssueNote(issueId) {
  const note = document.getElementById('issue-note-text')?.value.trim()
  if (!note) {
    showToast('Please enter a note', 'error')
    return
  }
  try {
    await api(`/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved', adminNote: note }),
    })
    document.getElementById('issue-note-modal').remove()
    showToast('Issue resolved & customer notified on WhatsApp', 'success')
    loadIssues()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

console.log('The Fish Merchant App Loaded!')
