class AdminDashboard {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL || 'http://localhost:5000/api';
        this.authToken = AuthManager.getAuthToken();
        
        if (!this.authToken) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        this.init();
        this.setupMobileMenu(); // Add this line
    }
    
    // Add this method
    setupMobileMenu() {
        // Handle sidebar clicks for mobile
        document.querySelectorAll('.offcanvas .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768) {
                const sidebar = document.querySelector('.sidebar');
                const backdrop = document.querySelector('.sidebar-backdrop');
                const target = e.target;
                
                if (sidebar && sidebar.classList.contains('show') && 
                    !sidebar.contains(target) && 
                    !target.closest('[data-bs-toggle="offcanvas"]')) {
                    sidebar.classList.remove('show');
                    if (backdrop) backdrop.classList.remove('show');
                }
            }
        });
    }
    init() {
        this.setupNavigation();
        this.loadDashboardStats();
        this.loadPropertiesForTable();
        this.loadPropertiesForSelect();
        this.setupForms();
    }
    
    setupNavigation() {
        // Handle sidebar clicks
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show selected section
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }
    
  showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    
    // Show selected section
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
    
    // Update title
    const sectionTitle = document.getElementById('sectionTitle');
    const titles = {
        'dashboard': 'Dashboard',
        'properties': 'Properties',
        'add-property': 'Add Property',
        'media': 'Media Library',
        'contact-messages': 'Contact Messages' // ADD THIS LINE
    };
    sectionTitle.textContent = titles[section] || 'Dashboard';
    
    // Load data for section
    switch(section) {
        case 'properties':
            this.loadPropertiesForTable();
            break;
        case 'dashboard':
            this.loadDashboardStats();
            break;
        case 'media':
            this.loadMediaLibrary();
            break;
        case 'contact-messages': // ADD THIS CASE
            this.loadContactMessages();
            break;
    }
    
    // Close mobile menu if open
    if (window.innerWidth < 768) {
        const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('mobileSidebar'));
        if (offcanvas) offcanvas.hide();
    }
}
    async loadDashboardStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load stats');
            
            const properties = await response.json();
            
            // Calculate stats
            const totalProperties = properties.length;
            const totalImages = properties.reduce((sum, prop) => sum + (prop.photos ? prop.photos.length : 0), 0);
            const totalVideos = properties.reduce((sum, prop) => sum + (prop.videos ? prop.videos.length : 0), 0);
            
            // Update UI
            document.getElementById('totalProperties').textContent = totalProperties;
            document.getElementById('totalImages').textContent = totalImages;
            document.getElementById('totalVideos').textContent = totalVideos;
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }
    
    async loadPropertiesForTable() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load properties');
            
            const properties = await response.json();
            this.displayPropertiesTable(properties);
            
        } catch (error) {
            console.error('Error loading properties:', error);
            document.getElementById('propertiesTable').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Failed to load properties
                    </td>
                </tr>
            `;
        }
    }
    
    async loadPropertiesForSelect() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load properties');
            
            const properties = await response.json();
            
            // Populate select dropdowns
            const imageSelect = document.getElementById('propertySelectImage');
            const videoSelect = document.getElementById('propertySelectVideo');
            
            imageSelect.innerHTML = '<option value="">Choose property...</option>';
            videoSelect.innerHTML = '<option value="">Choose property...</option>';
            
            properties.forEach(property => {
                const option = `<option value="${property.id}">${property.title} (${property.location})</option>`;
                imageSelect.innerHTML += option;
                videoSelect.innerHTML += option;
            });
            
        } catch (error) {
            console.error('Error loading properties for select:', error);
        }
    }
    
    displayPropertiesTable(properties) {
        const tableBody = document.getElementById('propertiesTable');
        
        if (!properties || properties.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No properties found</td>
                </tr>
            `;
            return;
        }
        
        const rows = properties.map(property => {
            const price = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(property.price);
            
            const date = new Date(property.created_at).toLocaleDateString();
            
            return `
                <tr>
                    <td>${property.id}</td>
                    <td>${property.title}</td>
                    <td>${property.location}</td>
                    <td>${price}</td>
                    <td>${date}</td>
                    <td>
                        <button onclick="adminDashboard.editProperty(${property.id})" 
                                class="btn btn-sm btn-outline-primary me-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminDashboard.deleteProperty(${property.id})" 
                                class="btn btn-sm btn-outline-danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = rows;
    }
    
    setupForms() {
        // Add property form
        document.getElementById('addPropertyForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProperty();
        });
        
        // Upload image form
        document.getElementById('uploadImageForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadImage();
        });
        
        // Upload video form
        document.getElementById('uploadVideoForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadVideo();
        });
    }
    
    async addProperty() {
        const form = document.getElementById('addPropertyForm');
        const formData = {
            title: document.getElementById('propertyTitle').value,
            description: document.getElementById('propertyDescription').value,
            price: document.getElementById('propertyPrice').value,
            location: document.getElementById('propertyLocation').value,
            sqft: document.getElementById('propertySqft').value,
            mobile_number: document.getElementById('propertyMobile').value
        };
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Property added successfully! Property ID: ' + data.propertyId);
                form.reset();
                this.loadPropertiesForTable();
                this.loadPropertiesForSelect();
                this.loadDashboardStats();
            } else {
                alert('Error: ' + (data.error || 'Failed to add property'));
            }
        } catch (error) {
            console.error('Error adding property:', error);
            alert('Network error. Please try again.');
        }
    }
    
    async editProperty(propertyId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties/${propertyId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load property');
            
            const property = await response.json();
            
            // Populate form
            document.getElementById('editPropertyId').value = property.id;
            document.getElementById('editPropertyTitle').value = property.title;
            document.getElementById('editPropertyDescription').value = property.description || '';
            document.getElementById('editPropertyPrice').value = property.price;
            document.getElementById('editPropertyLocation').value = property.location;
            document.getElementById('editPropertySqft').value = property.sqft || '';
            document.getElementById('editPropertyMobile').value = property.mobile_number;
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('editPropertyModal'));
            modal.show();
            
        } catch (error) {
            console.error('Error loading property for edit:', error);
            alert('Failed to load property details');
        }
    }
    
    async updateProperty() {
        const propertyId = document.getElementById('editPropertyId').value;
        const formData = {
            title: document.getElementById('editPropertyTitle').value,
            description: document.getElementById('editPropertyDescription').value,
            price: document.getElementById('editPropertyPrice').value,
            location: document.getElementById('editPropertyLocation').value,
            sqft: document.getElementById('editPropertySqft').value,
            mobile_number: document.getElementById('editPropertyMobile').value
        };
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties/${propertyId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Property updated successfully!');
                
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editPropertyModal'));
                modal.hide();
                
                // Refresh data
                this.loadPropertiesForTable();
                this.loadPropertiesForSelect();
                this.loadDashboardStats();
            } else {
                alert('Error: ' + (data.error || 'Failed to update property'));
            }
        } catch (error) {
            console.error('Error updating property:', error);
            alert('Network error. Please try again.');
        }
    }
    
    async deleteProperty(propertyId) {
        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/properties/${propertyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Property deleted successfully!');
                this.loadPropertiesForTable();
                this.loadPropertiesForSelect();
                this.loadDashboardStats();
            } else {
                alert('Error: ' + (data.error || 'Failed to delete property'));
            }
        } catch (error) {
            console.error('Error deleting property:', error);
            alert('Network error. Please try again.');
        }
    }
    
    async uploadImage() {
        const propertyId = document.getElementById('propertySelectImage').value;
        const fileInput = document.getElementById('imageFile');
        
        if (!propertyId || !fileInput.files[0]) {
            alert('Please select a property and choose an image file');
            return;
        }
        
        const formData = new FormData();
        formData.append('propertyId', propertyId);
        formData.append('image', fileInput.files[0]);
        
        this.showUploadProgress(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/upload/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: formData
            });
            
            this.showUploadProgress(false);
            
            const data = await response.json();
            
            if (response.ok) {
                this.showUploadMessage('Image uploaded successfully!', 'success');
                document.getElementById('uploadImageForm').reset();
                this.loadDashboardStats();
            } else {
                this.showUploadMessage('Error: ' + (data.error || 'Upload failed'), 'danger');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showUploadProgress(false);
            this.showUploadMessage('Network error. Please try again.', 'danger');
        }
    }
    // Add method to load contact messages
async loadContactMessages() {
    try {
        const response = await fetch(`${this.apiBaseUrl}/contact`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load messages');
        
        const messages = await response.json();
        this.displayContactMessages(messages);
        
    } catch (error) {
        console.error('Error loading contact messages:', error);
        document.getElementById('contactMessagesTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    Failed to load messages
                </td>
            </tr>
        `;
    }
}

displayContactMessages(messages) {
    const tableBody = document.getElementById('contactMessagesTable');
    
    if (!messages || messages.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No contact messages yet</td>
            </tr>
        `;
        return;
    }
    
    const rows = messages.map(msg => `
        <tr>
            <td>${msg.id}</td>
            <td>${msg.name}</td>
            <td>
                <a href="tel:${msg.phone}" class="text-decoration-none">
                    <i class="fas fa-phone me-1"></i>${msg.phone}
                </a>
            </td>
            <td>
                ${msg.email ? `
                    <a href="mailto:${msg.email}" class="text-decoration-none">
                        <i class="fas fa-envelope me-1"></i>${msg.email}
                    </a>
                ` : '<span class="text-muted">No email</span>'}
            </td>
            <td style="max-width: 200px; word-wrap: break-word;">
                <small>${msg.message.substring(0, 80)}${msg.message.length > 80 ? '...' : ''}</small>
            </td>
            <td>${new Date(msg.created_at).toLocaleDateString()}</td>
            <td>
                <button data-action="view" data-id="${msg.id}" 
                        class="btn btn-sm btn-outline-info">
                    <i class="fas fa-eye"></i>
                </button>
                <button data-action="delete" data-id="${msg.id}" 
                        class="btn btn-sm btn-outline-danger ms-1">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = rows;

    // Delegate click handlers for view/delete buttons (works for any id type)
    // Remove previous handler if present
    if (this._contactClickHandler) {
        tableBody.removeEventListener('click', this._contactClickHandler);
    }

    this._contactClickHandler = (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'view') {
            this.viewMessage(id);
        } else if (action === 'delete') {
            this.deleteMessage(id);
        }
    };

    tableBody.addEventListener('click', this._contactClickHandler);
}

// Add these methods to AdminDashboard class
async viewMessage(messageId) {
    try {
        const response = await fetch(`${this.apiBaseUrl}/contact/item/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load message');
        
        const message = await response.json();
        
        // Show message in modal
        const modalHTML = `
            <div class="modal fade" id="messageModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Message from ${message.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong><i class="fas fa-user me-2"></i>Name:</strong>
                                    <p>${message.name}</p>
                                </div>
                                <div class="col-md-6">
                                    <strong><i class="fas fa-phone me-2"></i>Phone:</strong>
                                    <p><a href="tel:${message.phone}">${message.phone}</a></p>
                                </div>
                            </div>
                            ${message.email ? `
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <strong><i class="fas fa-envelope me-2"></i>Email:</strong>
                                    <p><a href="mailto:${message.email}">${message.email}</a></p>
                                </div>
                            </div>
                            ` : ''}
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <strong><i class="fas fa-comment me-2"></i>Message:</strong>
                                    <div class="border rounded p-3 mt-2">
                                        ${message.message.replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <strong><i class="fas fa-clock me-2"></i>Received:</strong>
                                    <p>${new Date(message.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${message.email ? `
                            <a href="mailto:${message.email}" class="btn btn-primary">
                                <i class="fas fa-reply me-1"></i>Reply via Email
                            </a>
                            ` : ''}
                            <a href="tel:${message.phone}" class="btn btn-success">
                                <i class="fas fa-phone me-1"></i>Call Back
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Replace existing modal (if any) to ensure content is current
        const existing = document.getElementById('messageModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('messageModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error viewing message:', error);
        alert('Failed to load message details');
    }
}

async deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        const response = await fetch(`${this.apiBaseUrl}/contact/item/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });
        
        if (response.ok) {
            alert('Message deleted successfully');
            this.loadContactMessages();
        } else {
            alert('Failed to delete message');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Network error. Please try again.');
    }
}
    async uploadVideo() {
    const propertyId = document.getElementById('propertySelectVideo').value;
    const fileInput = document.getElementById('videoFile');
    
    if (!propertyId || !fileInput.files[0]) {
        alert('Please select a property and choose a video file');
        return;
    }
    
    const file = fileInput.files[0];
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    console.log(`Selected video: ${file.name}, Size: ${fileSizeMB}MB`);
    
    // Check file size client-side (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
        alert(`❌ Video file must be less than 50MB. Your file is ${fileSizeMB}MB`);
        return;
    }
    
    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
        alert('❌ Please select a video file (MP4, MPEG, etc.)');
        return;
    }
    
    // Show estimated time based on file size
    const estimatedTime = Math.max(30, Math.ceil(file.size / (1024 * 1024))); // At least 30 seconds
    const message = `Uploading ${fileSizeMB}MB video... Estimated time: ${estimatedTime} seconds`;
    
    const formData = new FormData();
    formData.append('propertyId', propertyId);
    formData.append('video', file);
    
    this.showUploadProgress(true, message, 'video');
    
    try {
        // Start timeout for visual feedback
        let progressInterval = setInterval(() => {
            this.updateProgressAnimation();
        }, 500);
        
        const response = await fetch(`${this.apiBaseUrl}/upload/video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            },
            body: formData
        });
        
        clearInterval(progressInterval);
        this.showUploadProgress(false);
        
        const data = await response.json();
        
        if (response.ok) {
            this.showUploadMessage(
                `✅ Video uploaded successfully! (${(data.size / (1024 * 1024)).toFixed(2)}MB, ${data.duration || 'N/A'}s)`,
                'success'
            );
            document.getElementById('uploadVideoForm').reset();
            
            // Refresh data immediately
            await this.loadDashboardStats();
            
            // Show success animation
            this.showSuccessAnimation();
            
        } else {
            this.showUploadMessage(`❌ ${data.error || 'Upload failed'}: ${data.message || ''}`, 'danger');
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        this.showUploadProgress(false);
        
        if (error.name === 'AbortError') {
            this.showUploadMessage('❌ Upload was cancelled or timed out', 'warning');
        } else {
            this.showUploadMessage('❌ Network error. Please try again with a smaller file.', 'danger');
        }
    }
}

showUploadProgress(show, message = 'Uploading...', type = 'image') {
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const progressText = document.getElementById('progressText');
    
    if (show) {
        progressDiv.style.display = 'block';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        progressBar.classList.remove('bg-success', 'bg-danger');
        progressBar.classList.add('progress-bar-striped', 'progress-bar-animated');
        
        if (type === 'video') {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-primary');
        }
        
        progressText.textContent = message;
        progressText.className = type === 'video' ? 'text-warning' : 'text-primary';
        
        // Store reference for animation
        this.progressBar = progressBar;
        this.progressStartTime = Date.now();
        
    } else {
        progressDiv.style.display = 'none';
        progressBar.style.width = '0%';
        progressBar.textContent = '';
        progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated', 'bg-primary', 'bg-warning', 'bg-success', 'bg-danger');
        progressText.textContent = '';
        this.progressBar = null;
    }
}

updateProgressAnimation() {
    if (!this.progressBar) return;
    
    const elapsed = Date.now() - this.progressStartTime;
    const totalEstimate = 120000; // 2 minutes estimate
    
    // Simulate progress (not real, just visual feedback)
    let progress = Math.min(95, Math.floor((elapsed / totalEstimate) * 100));
    this.progressBar.style.width = progress + '%';
    this.progressBar.textContent = progress + '%';
}

showSuccessAnimation() {
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const progressText = document.getElementById('progressText');
    
    if (progressDiv.style.display === 'block') {
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated', 'bg-warning', 'bg-primary');
        progressBar.classList.add('bg-success');
        progressText.textContent = '✅ Upload Complete!';
        progressText.className = 'text-success';
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.showUploadProgress(false);
        }, 3000);
    }
}
    
    
    showUploadMessage(text, type) {
        const messageDiv = document.getElementById('uploadMessage');
        messageDiv.textContent = text;
        messageDiv.className = `alert alert-${type}`;
        messageDiv.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

// Load media library and render media items
async loadMediaLibrary() {
    try {
        const response = await fetch(`${this.apiBaseUrl}/properties`, {
            headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        if (!response.ok) throw new Error('Failed to load properties');
        const properties = await response.json();

        const container = document.getElementById('mediaList');
        if (!container) return;

        if (!properties || properties.length === 0) {
            container.innerHTML = '<div class="col-12 text-center">No media found</div>';
            return;
        }

        // Build cards for each media item grouped by property
        let html = '';
        properties.forEach(prop => {
            const media = [];
            if (prop.photos && prop.photos.length) {
                prop.photos.forEach(url => media.push({ type: 'photo', url }));
            }
            if (prop.videos && prop.videos.length) {
                prop.videos.forEach(url => media.push({ type: 'video', url }));
            }

            if (media.length === 0) return;

            html += `
                <div class="col-12">
                    <h6 class="mb-2">${prop.title} <small class="text-muted">(${prop.location})</small></h6>
                    <div class="row g-2 mb-4">
            `;

            media.forEach(m => {
                // We don't have media id here, so we'll fetch media IDs separately per property
                // Instead, render with data-url and add a button to open property media panel
                if (m.type === 'photo') {
                    html += `
                        <div class="col-6 col-md-3">
                            <div class="card">
                                <img src="${m.url}" class="card-img-top" style="height:140px;object-fit:cover" />
                                <div class="card-body p-2 text-center">
                                    <button class="btn btn-sm btn-outline-danger btn-delete-media" data-url="${m.url}" data-type="photo" data-property="${prop.id}">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="col-6 col-md-3">
                            <div class="card">
                                <video src="${m.url}" class="w-100" style="height:140px;object-fit:cover" muted playsinline></video>
                                <div class="card-body p-2 text-center">
                                    <button class="btn btn-sm btn-outline-danger btn-delete-media" data-url="${m.url}" data-type="video" data-property="${prop.id}">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;

        // Attach delegated handler for delete buttons
        container.querySelectorAll('.btn-delete-media').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const url = btn.dataset.url;
                const type = btn.dataset.type;
                const propertyId = btn.dataset.property;
                // Need to find media id on server by matching URL
                await this.deleteMediaByUrl(propertyId, url);
            });
        });

    } catch (error) {
        console.error('Error loading media library:', error);
    }
}

// Delete media by URL: find media id server-side then call delete endpoint
async deleteMediaByUrl(propertyId, mediaUrl) {
    if (!confirm('Delete this media? This cannot be undone.')) return;
    try {
        // Fetch property details to get media IDs
        const response = await fetch(`${this.apiBaseUrl}/properties/${propertyId}`, {
            headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        if (!response.ok) throw new Error('Failed to load property');
        const prop = await response.json();

        // property_media rows are returned by API as photos/videos arrays; need to query media table via endpoint
        // The properties API doesn't return media ids, so call a new endpoint /api/properties/:id/media
        const mediaRes = await fetch(`${this.apiBaseUrl}/properties/${propertyId}/media`, {
            headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        if (!mediaRes.ok) throw new Error('Failed to load media items');
        const mediaItems = await mediaRes.json();

        const item = mediaItems.find(m => m.media_url === mediaUrl);
        if (!item) {
            alert('Media item not found on server');
            return;
        }

        // Call delete endpoint
        const del = await fetch(`${this.apiBaseUrl}/upload/media/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        if (del.ok) {
            alert('Media deleted');
            this.loadMediaLibrary();
            this.loadDashboardStats();
        } else {
            const err = await del.json();
            alert('Failed to delete media: ' + (err.error || 'Unknown'));
        }

    } catch (error) {
        console.error('Error deleting media by URL:', error);
        alert('Network error. Try again.');
    }
}

}