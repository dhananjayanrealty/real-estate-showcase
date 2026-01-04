class PropertyDetails {
    constructor() {
        console.log('=== PropertyDetails Constructor Started ===');
        console.log('Window API_BASE_URL:', window.API_BASE_URL);
        console.log('Current URL:', window.location.href);
        console.log('URL Search:', window.location.search);
        
        this.apiBaseUrl = window.API_BASE_URL || 'https://real-estate-showcase-backend.onrender.com/api';
        console.log('Using API URL:', this.apiBaseUrl);
        
        this.propertyId = this.getPropertyIdFromUrl();
        console.log('Extracted Property ID:', this.propertyId);
        
        this.propertyDetails = document.getElementById('propertyDetails');
        this.galleryContainer = document.getElementById('galleryContainer');
        this.videoContainer = document.getElementById('videoContainer');
        this.imageGallery = document.getElementById('imageGallery');
        this.videoGallery = document.getElementById('videoGallery');
        this.images = [];
        this.currentImageIndex = 0;
        this._lightboxKeyHandler = null;
        this.modalEl = document.getElementById('imageModal');
        this.modalImg = document.getElementById('modalImage');
        this.modalCaption = document.getElementById('modalCaption');
        
        if (this.propertyId) {
            console.log('Loading property details for ID:', this.propertyId);
            this.loadPropertyDetails();
        } else {
            console.error('No property ID found in URL');
            this.showError('Property ID not found in URL. Please go back and select a property.');
        }
    }
    
  getPropertyIdFromUrl() {
    // Try hash first, then query params
    const hash = window.location.hash;
    console.log('Hash:', hash);
    
    if (hash && hash.includes('id=')) {
        const idFromHash = hash.split('id=')[1];
        console.log('ID from hash:', idFromHash);
        return idFromHash;
    }
    
    // Fallback to query params
    const urlParams = new URLSearchParams(window.location.search);
    const idFromParams = urlParams.get('id');
    console.log('ID from query params:', idFromParams);
    
    return idFromParams;
}
    
    async loadPropertyDetails() {
        try {
            if (!this.propertyId) {
                this.showError('No property ID specified');
                return;
            }
            
            console.log('Fetching property from:', `${this.apiBaseUrl}/properties/${this.propertyId}`);
            
            const response = await fetch(`${this.apiBaseUrl}/properties/${this.propertyId}`);
            
            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Property with ID ${this.propertyId} not found`);
                }
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const property = await response.json();
            console.log('Property data received:', property);
            
            this.displayPropertyDetails(property);
            
        } catch (error) {
            console.error('Error loading property details:', error);
            this.showError(error.message || 'Failed to load property details');
        }
    }
    
    displayPropertyDetails(property) {
        if (!property || !property.id) {
            this.showError('Invalid property data received from server');
            return;
        }
        
        // Format price
        const price = this.formatPrice(property.price);
        
        const detailsHTML = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="property-header rounded-lg p-4 mb-4" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <h1 class="fw-bold mb-3">${property.title || 'No Title'}</h1>
                        <h2 class="text-warning mb-4">${price}</h2>
                        <div class="d-flex flex-wrap gap-3">
                            <span class="badge bg-light text-dark fs-6">
                                <i class="fas fa-map-marker-alt me-2"></i>${property.location || 'Location not specified'}
                            </span>
                            <span class="badge bg-light text-dark fs-6">
                                <i class="fas fa-expand-arrows-alt me-2"></i>${property.sqft || 'N/A'} sqft
                            </span>
                        </div>
                    </div>
                    
                    <div class="property-description mb-5">
                        <h4 class="mb-3">Description</h4>
                        <p class="lead">${property.description || 'No description available.'}</p>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="property-features rounded-lg p-4 mb-4" style="background: #f8f9fa;">
                        <h4 class="mb-4">Property Features</h4>
                        
                        <div class="feature-item mb-3">
                            <i class="fas fa-rupee-sign me-3 text-primary"></i>
                            <div>
                                <strong>Price:</strong> ${price}
                            </div>
                        </div>
                        
                        <div class="feature-item mb-3">
                            <i class="fas fa-map-marker-alt me-3 text-primary"></i>
                            <div>
                                <strong>Location:</strong> ${property.location || 'Not specified'}
                            </div>
                        </div>
                        
                        <div class="feature-item mb-3">
                            <i class="fas fa-expand-arrows-alt me-3 text-primary"></i>
                            <div>
                                <strong>Area:</strong> ${property.sqft || 'N/A'} sqft
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="text-center mt-4">
                            <h5 class="mb-3">Contact Broker</h5>
                            <a href="tel:${property.mobile_number || '+91 9876543210'}" class="btn btn-success btn-lg w-100 mb-3">
                                <i class="fas fa-phone me-2"></i>Call Now: ${property.mobile_number || '+91 9876543210'}
                            </a>
                            <p class="text-muted small">
                                <i class="fas fa-user me-2"></i>
                                Direct contact with property owner
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.propertyDetails.innerHTML = detailsHTML;
        
        // Display images if available
        if (property.photos && property.photos.length > 0) {
            this.displayImages(property.photos);
            this.imageGallery.style.display = 'block';
        } else {
            this.imageGallery.style.display = 'none';
            document.getElementById('imageGallery').innerHTML = '<p class="text-muted">No photos available for this property.</p>';
        }
        
        // Display videos if available
        if (property.videos && property.videos.length > 0) {
            this.displayVideos(property.videos);
            this.videoGallery.style.display = 'block';
        } else {
            this.videoGallery.style.display = 'none';
            document.getElementById('videoGallery').innerHTML = '<p class="text-muted">No videos available for this property.</p>';
        }
    }
    
    formatPrice(price) {
        try {
            const numPrice = parseFloat(price);
            if (isNaN(numPrice)) return 'Price not available';
            
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(numPrice);
        } catch (error) {
            return 'Price not available';
        }
    }
    
    displayImages(images) {
        if (!Array.isArray(images) || images.length === 0) {
            this.galleryContainer.innerHTML = '<p class="text-muted">No images available</p>';
            return;
        }
        // store images for lightbox navigation (filtered)
        this.images = images.filter(img => !!img);
        const imageHTML = this.images.map((image, index) => {
            if (!image) return '';
            return `
                <div class="gallery-item rounded">
                    <img src="${image}" 
                         class="gallery-img rounded w-100" 
                         alt="Property Image ${index + 1}"
                         data-image-index="${index}"
                         style="cursor: pointer;"
                    />
                </div>
            `;
        }).join('');

        this.galleryContainer.innerHTML = imageHTML;

        // Wire up click handlers to open lightbox and set current index
        this.galleryContainer.querySelectorAll('.gallery-img').forEach((img) => {
            img.addEventListener('click', (e) => {
                const idx = parseInt(img.dataset.imageIndex, 10);
                this.openLightbox(idx);
            });
        });

        // Setup modal controls (prev/next/keyboard)
        this.setupLightboxControls();
    }

    openLightbox(index) {
        if (!Number.isFinite(index)) index = 0;
        this.currentImageIndex = Math.max(0, Math.min(index, this.images.length - 1));
        this.showImage(this.currentImageIndex);

        if (this.modalEl) {
            const modal = new bootstrap.Modal(this.modalEl);
            modal.show();
        }
    }

    showImage(index) {
        if (!this.modalImg) return;
        const src = this.images[index] || '';
        console.debug('showImage', index, 'src=', src);
        this.modalImg.src = src;
        this.modalImg.alt = `Property Image ${index + 1}`;
        if (this.modalCaption) {
            this.modalCaption.textContent = `${index + 1} / ${this.images.length}`;
        }
    }

    nextImage() {
        if (this.images.length === 0) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        console.debug('nextImage ->', this.currentImageIndex);
        this.showImage(this.currentImageIndex);
    }

    prevImage() {
        if (this.images.length === 0) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        console.debug('prevImage ->', this.currentImageIndex);
        this.showImage(this.currentImageIndex);
    }

    setupLightboxControls() {
        if (!this.modalEl) {
            this.modalEl = document.getElementById('imageModal');
        }
        if (!this.modalImg) {
            this.modalImg = document.getElementById('modalImage');
        }
        if (!this.modalCaption) {
            this.modalCaption = document.getElementById('modalCaption');
        }

        const prevBtn = document.getElementById('modalPrev');
        const nextBtn = document.getElementById('modalNext');

        if (prevBtn) prevBtn.onclick = () => this.prevImage();
        if (nextBtn) nextBtn.onclick = () => this.nextImage();

        // Keyboard navigation while modal is open
        const keyHandler = (e) => {
            if (!this.modalEl) return;
            // only respond when modal is visible
            if (!this.modalEl.classList.contains('show')) return;
            if (e.key === 'ArrowLeft') this.prevImage();
            if (e.key === 'ArrowRight') this.nextImage();
            if (e.key === 'Escape') {
                const modalInstance = bootstrap.Modal.getInstance(this.modalEl);
                if (modalInstance) modalInstance.hide();
            }
        };

        // Avoid multiple bindings
        if (this._lightboxKeyHandler) {
            document.removeEventListener('keydown', this._lightboxKeyHandler);
        }
        this._lightboxKeyHandler = keyHandler;
        document.addEventListener('keydown', this._lightboxKeyHandler);

        // Cleanup on modal hide
        if (this.modalEl) {
            this.modalEl.addEventListener('hidden.bs.modal', () => {
                // optional: clear src to stop large image memory
                if (this.modalImg) this.modalImg.src = '';
            });
        }
    }
    
    displayVideos(videos) {
        if (!Array.isArray(videos) || videos.length === 0) {
            this.videoContainer.innerHTML = '<p class="text-muted">No videos available</p>';
            return;
        }
        
        const videoHTML = videos.map((video, index) => {
            if (!video) return '';
            return `
                <div class="video-item mb-4">
                    <h6 class="mb-2">Video ${index + 1}</h6>
                    <div class="ratio ratio-16x9">
                        <video controls class="rounded" preload="metadata" style="width: 100%;">
                            <source src="${video}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            `;
        }).join('');
        
        this.videoContainer.innerHTML = videoHTML;
    }
    
    showError(message) {
        this.propertyDetails.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="fas fa-exclamation-triangle me-2"></i>Error</h4>
                <p>${message}</p>
                <p><strong>Current URL:</strong> ${window.location.href}</p>
                <p><strong>Expected URL format:</strong> property-details.html?id=1</p>
                <div class="mt-3">
                    <a href="index.html" class="btn btn-outline-primary">
                        <i class="fas fa-arrow-left me-2"></i>Back to Properties
                    </a>
                    <button onclick="location.reload()" class="btn btn-outline-secondary ms-2">
                        <i class="fas fa-redo me-2"></i>Reload Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Document Loaded ===');
    console.log('Checking for propertyDetails element...');
    
    if (document.getElementById('propertyDetails')) {
        console.log('propertyDetails element found, initializing PropertyDetails...');
        new PropertyDetails();
    } else {
        console.error('propertyDetails element NOT FOUND!');
    }
});