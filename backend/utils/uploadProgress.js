// In-memory store for upload progress
const uploadProgress = new Map();

class UploadProgressTracker {
    static setProgress(uploadId, progress) {
        uploadProgress.set(uploadId, {
            progress,
            timestamp: Date.now()
        });
    }
    
    static getProgress(uploadId) {
        const data = uploadProgress.get(uploadId);
        if (!data) return null;
        
        // Clean up old entries (older than 1 hour)
        if (Date.now() - data.timestamp > 3600000) {
            uploadProgress.delete(uploadId);
            return null;
        }
        
        return data.progress;
    }
    
    static deleteProgress(uploadId) {
        uploadProgress.delete(uploadId);
    }
    
    static cleanup() {
        const now = Date.now();
        for (const [id, data] of uploadProgress.entries()) {
            if (now - data.timestamp > 3600000) {
                uploadProgress.delete(id);
            }
        }
    }
}

// Clean up every hour
setInterval(() => UploadProgressTracker.cleanup(), 3600000);

module.exports = UploadProgressTracker;