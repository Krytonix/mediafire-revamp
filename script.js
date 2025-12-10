class FileUploader {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.filesList = document.getElementById('filesList');
        this.successModal = document.getElementById('successModal');
        this.downloadInfo = document.getElementById('downloadInfo');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.clickToUpload = document.getElementById('clickToUpload');

        this.init();
    }

    init() {
        // Click to upload
        this.clickToUpload.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // Copy button
        this.copyBtn.addEventListener('click', () => this.copyLink());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        this.handleFiles(e.dataTransfer.files);
    }

    handleFiles(files) {
        if (!files.length) return;

        Array.from(files).forEach(file => {
            if (file.size > 1024 * 1024 * 1024) { // 1GB limit
                this.showError(`File "${file.name}" is too large. Max 1GB allowed.`);
                return;
            }
            this.uploadFile(file);
        });
    }

    async uploadFile(file) {
        // Add to files list
        this.addFileToList(file);

        const formData = new FormData();
        formData.append('file', file);

        try {
            this.showProgress(0);

            const xhr = new XMLHttpRequest();
            
            // Progress tracking
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    this.updateProgress(percent, `${percent}% - ${this.formatBytes(e.loaded)} / ${this.formatBytes(e.total)}`);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    this.showSuccess(response);
                } else {
                    this.showError('Upload failed. Please try again.');
                }
            });

            xhr.addEventListener('error', () => {
                this.showError('Upload failed. Please check your connection.');
            });

            xhr.open('POST', '/upload');
            xhr.send(formData);

        } catch (error) {
            this.showError('Upload failed: ' + error.message);
        }
    }

    addFileToList(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">${this.getFileIcon(file.type)}</div>
            <div class="file-info">
                <h4>${file.name}</h4>
                <p>${this.formatBytes(file.size)} • ${file.type || 'Unknown'}</p>
            </div>
        `;
        this.filesList.appendChild(fileItem);
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '📷';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        return '📎';
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = text;
    }

    showProgress(percent) {
        this.progressContainer.style.display = 'block';
        this.updateProgress(percent, '0%');
    }

    showSuccess(data) {
        this.progressContainer.style.display = 'none';
        this.downloadInfo.innerHTML = `
            <h3>${data.filename}</h3>
            <div class="download-link">${window.location.origin}${data.downloadUrl}</div>
        `;
        this.downloadBtn.href = data.downloadUrl;
        this.successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    showError(message) {
        this.progressContainer.style.display = 'none';
        alert(message);
    }

    copyLink() {
        const link = this.downloadInfo.querySelector('.download-link').textContent;
        navigator.clipboard.writeText(link).then(() => {
            const btn = this.copyBtn;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Close modal
document.getElementById('successModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('successModal')) {
        document.getElementById('successModal').classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Initialize uploader
document.addEventListener('DOMContentLoaded', () => {
    new FileUploader();
});
