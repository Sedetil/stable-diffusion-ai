// Configuration
const API_CONFIG = {
    baseUrl: 'https://api-inference.huggingface.co/models/',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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' // Store in environment variable in production
    }
};

// Elements
const generateBtn = document.getElementById('generate-image');
const downloadBtn = document.getElementById('download-image');
const promptInput = document.getElementById('image-prompt');
const modelSelect = document.getElementById('image-model');
const resultContainer = document.getElementById('image-result');
const loadingIndicator = document.getElementById('image-loading');

// Image cache for download
let currentImageBlob = null;

// Initialize
function initImageGenerator() {
    generateBtn.addEventListener('click', generateImage);
    downloadBtn.addEventListener('click', downloadImage);
    promptInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateImage();
        }
    });
}

// Generate image
async function generateImage() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showNotification('Please enter a description for your image', 'error');
        return;
    }

    // UI updates
    setLoading(true);
    resultContainer.innerHTML = '';
    downloadBtn.style.display = 'none';
    
    try {
        const selectedModel = modelSelect.value;
        const url = API_CONFIG.baseUrl + selectedModel;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }

        // Process successful response
        const imageBlob = await response.blob();
        currentImageBlob = imageBlob;
        
        const imageUrl = URL.createObjectURL(imageBlob);
        displayImage(imageUrl);
        
        // Show download button
        downloadBtn.style.display = 'block';
        
        // Log success
        console.log('Image generated successfully');
        
    } catch (error) {
        console.error('Error generating image:', error);
        resultContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message || 'Failed to generate image. Please try again.'}</p>
            </div>
        `;
    } finally {
        setLoading(false);
    }
}

// Display the generated image
function displayImage(imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Generated image';
    img.onload = () => {
        resultContainer.innerHTML = '';
        resultContainer.appendChild(img);
    };
    img.onerror = () => {
        resultContainer.innerHTML = '<p>Failed to load the generated image</p>';
    };
}

// Download the image
function downloadImage() {
    if (!currentImageBlob) {
        showNotification('No image available to download', 'error');
        return;
    }

    const prompt = promptInput.value.trim();
    const filename = prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-ai-image.png';
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(currentImageBlob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Image downloaded successfully', 'success');
}

// Set loading state
function setLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.style.display = 'flex';
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    } else {
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate';
    }
}

// Show notification message
function showNotification(message, type = 'info') {
    // This could be implemented in main.js as a shared function
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can implement a toast notification system here
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initImageGenerator);
