class PropertyManager {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL || 'https://real-estate-showcase-backend.onrender.com/api';
        console.log('🔧 PropertyManager initialized with API:', this.apiBaseUrl);
        
        this.propertiesGrid = document.getElementById('propertiesGrid');
        this.locationSearch = document.getElementById('locationSearch');
        this.minPrice = document.getElementById('minPrice');
        this.maxPrice = document.getElementById('maxPrice');
        this.searchBtn = document.getElementById('searchBtn');
        
        this.init();
    }
    
    init() {
        console.log('🚀 Starting PropertyManager...');
        this.loadProperties();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.loadProperties());
        }
        
        if (this.locationSearch) {
            this.locationSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.loadProperties();
            });
        }
    }
    
    async loadProperties() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams();
            if (this.locationSearch && this.locationSearch.value) {
                params.append('location', this.locationSearch.value);
            }
            if (this.minPrice && this.minPrice.value) {
                params.append('minPrice', this.minPrice.value);
            }
            if (this.maxPrice && this.maxPrice.value) {
                params.append('maxPrice', this.maxPrice.value);
            }
            
            console.log('📡 Fetching properties from API...');
            const response = await fetch(`${this.apiBaseUrl}/properties?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const properties = await response.json();
            console.log(`✅ Received ${properties.length} properties`);
            
            this.displayProperties(properties);
            
        } catch (error) {
            console.error('❌ Error loading properties:', error);
            this.showError('Failed to load properties. ' + error.message);
        }
    }
    
    displayProperties(properties) {
        if (!properties || properties.length === 0) {
            this.propertiesGrid.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No properties found. Try different search criteria.
                    </div>
                </div>
            `;
            return;
        }
        
        console.log('🎨 Displaying properties...');
        const propertiesHTML = properties.map(property => this.createPropertyCard(property)).join('');
        this.propertiesGrid.innerHTML = propertiesHTML;
        
        // Debug: Check links after they're rendered
        setTimeout(() => {
            const links = document.querySelectorAll('a[href*="property-details"]');
            console.log(`🔗 Found ${links.length} property detail links`);
            links.forEach((link, index) => {
                console.log(`Link ${index}: ${link.href}`);
            });
        }, 100);
    }
    
    createPropertyCard(property) {
    const mainImage = property.photos && property.photos.length > 0 
        ? property.photos[0] 
        : 'https://via.placeholder.com/400x250?text=No+Image';
    
    const price = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(property.price);
    
    // USE HASH INSTEAD OF QUERY PARAM
    const detailUrl = `property-details.html#id=${property.id}`;
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card property-card h-100">
                <img src="${mainImage}" class="card-img-top property-img" alt="${property.title}" 
                     onerror="this.src='https://via.placeholder.com/400x250?text=Image+Not+Available'">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${property.title}</h5>
                        <span class="price-tag">${price}</span>
                    </div>
                    <p class="location mb-3">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${property.location}
                    </p>
                    <p class="card-text flex-grow-1">${this.truncateText(property.description, 100)}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted">
                                <i class="fas fa-expand-arrows-alt me-1"></i>
                                ${property.sqft || 'N/A'} sqft
                            </span>
                            <div>
                                <a href="${detailUrl}" class="btn btn-sm btn-outline-primary me-2">
                                    View Details
                                </a>
                                <a href="tel:${property.mobile_number}" class="btn btn-sm btn-success">
                                    <i class="fas fa-phone me-1"></i>Call
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    showLoading() {
        this.propertiesGrid.innerHTML = `
            <div class="col-12">
                <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="ms-3">Loading properties...</div>
                </div>
            </div>
        `;
    }
    
    showError(message) {
        this.propertiesGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                    <div class="mt-2">
                        <button onclick="location.reload()" class="btn btn-sm btn-outline-danger">
                            <i class="fas fa-redo me-1"></i>Retry
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Document loaded, initializing PropertyManager...');
    
    if (document.getElementById('propertiesGrid')) {
        const pm = new PropertyManager();
        console.log('✅ PropertyManager initialized');
        
        // Add click handler for View Details buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('view-details-btn')) {
                const propertyId = e.target.getAttribute('data-property-id');
                console.log(`👉 View Details clicked for property ID: ${propertyId}`);
                if (propertyId) {
                    window.location.href = `property-details.html?id=${propertyId}`;
                }
            }
        });
    }
});