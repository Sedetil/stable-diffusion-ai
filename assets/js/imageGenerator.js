// Configuration
const API_CONFIG = {
    baseUrl: 'https://api-inference.huggingface.co/models/',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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' // Store in environment variable in production
    },
    // Add timeout to prevent long-running requests
    timeout: 60000
};

// Model-specific configurations
const MODEL_CONFIG = {
    'stabilityai/stable-diffusion-2-1': {
        maxTokens: 77,
        needsExtraParams: true
    },
    'prompthero/openjourney': {
        maxTokens: 77,
        needsExtraParams: true
    },
    'runwayml/stable-diffusion-v1-5': {
        maxTokens: 77,
        needsExtraParams: false
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

    // Hide download button initially
    downloadBtn.style.display = 'none';
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
        
        // Prepare payload based on model requirements
        let payload = { inputs: prompt };
        
        // Add additional parameters for models that need them
        if (MODEL_CONFIG[selectedModel]?.needsExtraParams) {
            payload.parameters = {
                guidance_scale: 7.5,
                num_inference_steps: 50,
                width: 512,
                height: 512
            };
        }
        
        // Create an AbortController to handle timeouts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = `Server returned ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
                
                // Check for specific error types
                if (errorMessage.includes('token') || errorMessage.includes('authorization')) {
                    errorMessage = 'API authentication error. Please check your API token.';
                } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
                    errorMessage = 'API usage quota exceeded. Please try again later.';
                } else if (errorMessage.includes('loading') || errorMessage.includes('starting')) {
                    errorMessage = 'Model is still loading. Please try again in a moment.';
                }
            } catch (e) {
                // If we can't parse the error JSON, just use the status text
            }
            throw new Error(errorMessage);
        }

        // For some models, response might not be an image directly
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const jsonResponse = await response.json();
            
            if (Array.isArray(jsonResponse) && jsonResponse[0]) {
                // Some models return an array with base64 image data
                if (jsonResponse[0].image) {
                    const base64Data = jsonResponse[0].image;
                    const binaryData = atob(base64Data);
                    const byteArray = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        byteArray[i] = binaryData.charCodeAt(i);
                    }
                    currentImageBlob = new Blob([byteArray], { type: 'image/png' });
                    const imageUrl = URL.createObjectURL(currentImageBlob);
                    displayImage(imageUrl);
                    downloadBtn.style.display = 'block';
                    return;
                }
            }
            
            throw new Error('Unexpected JSON response format from API.');
        }

        // Process image response
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
        let errorMessage = error.message || 'Failed to generate image. Please try again.';
        
        // Handle AbortController timeout
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The model might be overloaded. Please try again later.';
        }
        
        resultContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${errorMessage}</p>
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
    
    // Create and display a toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initImageGenerator);