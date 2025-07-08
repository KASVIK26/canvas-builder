class CanvasBuilder {
    constructor() {
        this.baseUrl = this.getBaseUrl();
        this.canvasId = this.generateCanvasId();
        this.isCanvasInitialized = false;
        this.initializeEventListeners();
    }

    getBaseUrl() {
        // Auto-detect environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        // For production, update this to your backend URL
        return 'https://your-backend-url.vercel.app';
    }

    generateCanvasId() {
        return 'canvas_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initializeEventListeners() {
        // Canvas controls
        document.getElementById('initCanvas').addEventListener('click', () => this.initializeCanvas());
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('refreshPreview').addEventListener('click', () => this.refreshPreview());
        document.getElementById('exportPdf').addEventListener('click', () => this.exportToPDF());

        // Element controls
        document.getElementById('addRectangle').addEventListener('click', () => this.addRectangle());
        document.getElementById('addCircle').addEventListener('click', () => this.addCircle());
        document.getElementById('addText').addEventListener('click', () => this.addText());
        document.getElementById('addImage').addEventListener('click', () => this.addImage());

        // Auto-refresh preview when canvas is initialized
        this.setupAutoRefresh();
    }

    setupAutoRefresh() {
        // Auto-refresh preview after adding elements
        const autoRefreshDelay = 1000; // 1 second delay
        let refreshTimeout;

        const triggerAutoRefresh = () => {
            if (this.isCanvasInitialized) {
                clearTimeout(refreshTimeout);
                refreshTimeout = setTimeout(() => {
                    this.refreshPreview();
                }, autoRefreshDelay);
            }
        };

        // Add event listeners to trigger auto-refresh
        ['addRectangle', 'addCircle', 'addText', 'addImage'].forEach(id => {
            document.getElementById(id).addEventListener('click', triggerAutoRefresh);
        });
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('statusMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `status-message ${type}`;
        
        const icon = this.getIconForType(type);
        messageEl.innerHTML = `<i class="${icon}"></i> ${message}`;
        
        container.appendChild(messageEl);
        
        // Animate in
        setTimeout(() => messageEl.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => container.removeChild(messageEl), 300);
        }, 5000);
    }

    getIconForType(type) {
        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle',
            'warning': 'fas fa-exclamation-circle'
        };
        return icons[type] || icons['info'];
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/api/canvas${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    async initializeCanvas() {
        const width = parseInt(document.getElementById('canvasWidth').value);
        const height = parseInt(document.getElementById('canvasHeight').value);

        if (!width || !height || width < 100 || height < 100) {
            this.showMessage('Please enter valid dimensions (minimum 100x100)', 'error');
            return;
        }

        try {
            this.showLoading();
            
            const response = await this.makeRequest('/init', {
                method: 'POST',
                body: JSON.stringify({
                    width,
                    height,
                    id: this.canvasId
                })
            });

            this.isCanvasInitialized = true;
            this.showMessage('Canvas initialized successfully!', 'success');
            this.updateCanvasInfo(width, height);
            this.refreshPreview();
            
        } catch (error) {
            this.showMessage(`Failed to initialize canvas: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateCanvasInfo(width, height) {
        const info = document.getElementById('canvasInfo');
        info.textContent = `${width} × ${height} pixels`;
    }

    async addRectangle() {
        if (!this.isCanvasInitialized) {
            this.showMessage('Please initialize canvas first', 'warning');
            return;
        }

        const data = {
            id: this.canvasId,
            x: parseInt(document.getElementById('rectX').value) || 0,
            y: parseInt(document.getElementById('rectY').value) || 0,
            width: parseInt(document.getElementById('rectWidth').value) || 100,
            height: parseInt(document.getElementById('rectHeight').value) || 100,
            fillColor: document.getElementById('rectFill').value,
            strokeColor: document.getElementById('rectStroke').value,
            strokeWidth: parseInt(document.getElementById('rectStrokeWidth').value) || 0
        };

        try {
            await this.makeRequest('/add-rectangle', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            this.showMessage('Rectangle added successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to add rectangle: ${error.message}`, 'error');
        }
    }

    async addCircle() {
        if (!this.isCanvasInitialized) {
            this.showMessage('Please initialize canvas first', 'warning');
            return;
        }

        const data = {
            id: this.canvasId,
            x: parseInt(document.getElementById('circleX').value) || 0,
            y: parseInt(document.getElementById('circleY').value) || 0,
            radius: parseInt(document.getElementById('circleRadius').value) || 50,
            fillColor: document.getElementById('circleFill').value,
            strokeColor: document.getElementById('circleStroke').value,
            strokeWidth: parseInt(document.getElementById('circleStrokeWidth').value) || 0
        };

        try {
            await this.makeRequest('/add-circle', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            this.showMessage('Circle added successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to add circle: ${error.message}`, 'error');
        }
    }

    async addText() {
        if (!this.isCanvasInitialized) {
            this.showMessage('Please initialize canvas first', 'warning');
            return;
        }

        const text = document.getElementById('textContent').value.trim();
        if (!text) {
            this.showMessage('Please enter text content', 'warning');
            return;
        }

        const data = {
            id: this.canvasId,
            text,
            x: parseInt(document.getElementById('textX').value) || 0,
            y: parseInt(document.getElementById('textY').value) || 30,
            fontSize: parseInt(document.getElementById('textSize').value) || 20,
            fontFamily: document.getElementById('textFont').value,
            fillColor: document.getElementById('textFill').value,
            strokeColor: document.getElementById('textStroke').value,
            strokeWidth: parseInt(document.getElementById('textStrokeWidth').value) || 0
        };

        try {
            await this.makeRequest('/add-text', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            this.showMessage('Text added successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to add text: ${error.message}`, 'error');
        }
    }

    async addImage() {
        if (!this.isCanvasInitialized) {
            this.showMessage('Please initialize canvas first', 'warning');
            return;
        }

        const fileInput = document.getElementById('imageFile');
        const imageUrl = document.getElementById('imageUrl').value.trim();

        if (!fileInput.files[0] && !imageUrl) {
            this.showMessage('Please select an image file or enter an image URL', 'warning');
            return;
        }

        try {
            this.showLoading();
            
            const formData = new FormData();
            formData.append('id', this.canvasId);
            formData.append('x', document.getElementById('imageX').value || '0');
            formData.append('y', document.getElementById('imageY').value || '0');
            
            const width = document.getElementById('imageWidth').value;
            const height = document.getElementById('imageHeight').value;
            
            if (width) formData.append('width', width);
            if (height) formData.append('height', height);

            if (fileInput.files[0]) {
                formData.append('image', fileInput.files[0]);
            } else if (imageUrl) {
                formData.append('imageUrl', imageUrl);
            }

            const response = await fetch(`${this.baseUrl}/api/canvas/add-image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add image');
            }

            const result = await response.json();
            this.showMessage('Image added successfully!', 'success');
            
            // Clear the form
            fileInput.value = '';
            document.getElementById('imageUrl').value = '';
            
        } catch (error) {
            this.showMessage(`Failed to add image: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async refreshPreview() {
        if (!this.isCanvasInitialized) {
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/canvas/preview/${this.canvasId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch preview');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            const preview = document.getElementById('canvasPreview');
            const placeholder = document.getElementById('canvasPlaceholder');
            
            preview.src = imageUrl;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Clean up previous URL
            if (preview.previousImageUrl) {
                URL.revokeObjectURL(preview.previousImageUrl);
            }
            preview.previousImageUrl = imageUrl;
            
        } catch (error) {
            console.error('Preview refresh failed:', error);
            this.showMessage('Failed to refresh preview', 'error');
        }
    }

    async clearCanvas() {
        if (!this.isCanvasInitialized) {
            this.showMessage('No canvas to clear', 'warning');
            return;
        }

        try {
            await this.makeRequest('/clear', {
                method: 'POST',
                body: JSON.stringify({ id: this.canvasId })
            });

            this.showMessage('Canvas cleared successfully!', 'success');
            this.refreshPreview();
        } catch (error) {
            this.showMessage(`Failed to clear canvas: ${error.message}`, 'error');
        }
    }

    async exportToPDF() {
        if (!this.isCanvasInitialized) {
            this.showMessage('Please initialize canvas first', 'warning');
            return;
        }

        const filename = document.getElementById('exportFilename').value.trim() || 'canvas';

        try {
            this.showLoading();
            
            const response = await fetch(`${this.baseUrl}/api/canvas/export-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.canvasId,
                    filename
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to export PDF');
            }

            // Create download link
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showMessage('PDF exported successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to export PDF: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CanvasBuilder();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    // Clean up any object URLs
    const preview = document.getElementById('canvasPreview');
    if (preview && preview.previousImageUrl) {
        URL.revokeObjectURL(preview.previousImageUrl);
    }
});