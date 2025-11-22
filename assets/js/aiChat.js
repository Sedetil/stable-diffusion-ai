// Configuration
const CHAT_API_CONFIG = {
    apiKey: 'AIzaSyB0NX9p8WxhTldqpdEkEkIyC7qq5xUjoHw', // Store in environment variable in production
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash',
};

// Elements
const chatPromptInput = document.getElementById('chat-prompt');
const sendChatBtn = document.getElementById('send-chat');
const chatHistory = document.getElementById('chat-history');
const fileUploadBtn = document.getElementById('file-upload');
const voiceRecordBtn = document.getElementById('voice-record');

// Chat history
let conversationHistory = [];
let mediaRecorder = null;
let audioChunks = [];

// Initialize
function initAiChat() {
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatPromptInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Initialize file upload
    fileUploadBtn.addEventListener('change', handleFileUpload);

    // Initialize voice recording
    initVoiceRecording();
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Show loading state
        showNotification('Processing file...', 'info');
        
        // Convert file to base64
        const base64Data = await fileToBase64(file);
        
        // Add file message to UI
        addMessageToUI(`Uploaded file: ${file.name}`, 'user');
        
        // Prepare file data for Gemini
        const fileData = {
            inlineData: {
                data: base64Data,
                mimeType: file.type
            }
        };
        
        // Get AI response for file
        const response = await fetchGeminiResponseWithFile(fileData);
        
        // Add AI response to conversation
        addMessageToUI(response, 'system');
        
    } catch (error) {
        console.error('Error processing file:', error);
        showNotification('Error processing file. Please try again.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
}

// Initialize voice recording
function initVoiceRecording() {
    let isRecording = false;

    voiceRecordBtn.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                startRecording(stream);
                isRecording = true;
                voiceRecordBtn.innerHTML = '<i class="fas fa-stop"></i>';
                voiceRecordBtn.classList.add('recording');
                showNotification('Recording started...', 'info');
            } catch (error) {
                console.error('Error accessing microphone:', error);
                showNotification('Error accessing microphone', 'error');
            }
        } else {
            stopRecording();
            isRecording = false;
            voiceRecordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceRecordBtn.classList.remove('recording');
        }
    });
}

// Start voice recording
function startRecording(stream) {
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
    });
    
    mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        try {
            // Convert audio to text using Web Speech API
            const text = await audioToText(audioBlob);
            
            // Add transcribed text to chat
            addMessageToUI(`🎤 ${text}`, 'user');
            
            // Process with Gemini
            await sendChatMessage(text);
            
        } catch (error) {
            console.error('Error processing audio:', error);
            showNotification('Error processing audio', 'error');
        }
    });
    
    mediaRecorder.start();
}

// Stop voice recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// Convert audio to text using Web Speech API
function audioToText(audioBlob) {
    return new Promise((resolve, reject) => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            resolve(text);
        };
        
        recognition.onerror = (error) => {
            reject(error);
        };
        
        // Convert Blob to audio element and play
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audio.play();
        recognition.start();
    });
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
}

// Fetch Gemini response with file
async function fetchGeminiResponseWithFile(fileData) {
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: "Please analyze this file and provide insights:" },
                    fileData
                ]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        }
    };
    
    const url = `${CHAT_API_CONFIG.baseUrl}:generateContent?key=${CHAT_API_CONFIG.apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
}

// Send chat message
async function sendChatMessage() {
    const message = chatPromptInput.value.trim();
    if (!message) return;

    // Add user message to UI
    addMessageToUI(message, 'user');
    
    // Clear input and focus
    chatPromptInput.value = '';
    chatPromptInput.focus();
    
    // Start loading indicator
    sendChatBtn.disabled = true;
    sendChatBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Show typing indicator immediately
    showTypingIndicator();
    
    try {
        // Add to conversation history
        conversationHistory.push({ role: 'user', content: message });
        
        // Get AI response
        const response = await fetchGeminiResponse();
        
        // Add AI response to conversation history
        conversationHistory.push({ role: 'assistant', content: response });
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response to UI with typing effect
        addMessageWithTypingEffect(response);
        
    } catch (error) {
        console.error('Error in chat:', error);
        removeTypingIndicator();
        addMessageToUI('Sorry, I encountered an error. Please try again later.', 'system');
    } finally {
        // Reset button
        sendChatBtn.disabled = false;
        sendChatBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

// Show typing indicator in chat
function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message system typing-indicator';
    typingIndicator.id = 'typing-indicator';
    
    const avatarEl = document.createElement('div');
    avatarEl.className = 'avatar';
    avatarEl.innerHTML = '<i class="fas fa-robot"></i>';
    
    const messageContentEl = document.createElement('div');
    messageContentEl.className = 'message typing';
    messageContentEl.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    
    typingIndicator.appendChild(avatarEl);
    typingIndicator.appendChild(messageContentEl);
    
    chatHistory.appendChild(typingIndicator);
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Add message with typing effect
function addMessageWithTypingEffect(fullMessage) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message system';
    
    // Add avatar
    const avatarEl = document.createElement('div');
    avatarEl.className = 'avatar';
    avatarEl.innerHTML = '<i class="fas fa-robot"></i>';
    
    // Create message content element
    const messageContentEl = document.createElement('div');
    messageContentEl.className = 'message';
    messageContentEl.textContent = ''; // Start empty
    
    // Assemble message
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(messageContentEl);
    
    // Add to chat history
    chatHistory.appendChild(messageEl);
    
    // Format message with markdown-like syntax for rendering after typing effect
    const formattedMessage = formatMessage(fullMessage);
    
    // Apply typing effect
    let charIndex = 0;
    const typingSpeed = 5; // Characters per frame
    const minDelay = 30; // Minimum milliseconds between updates
    let lastUpdateTime = 0;
    
    function typeNextChunk(timestamp) {
        // Control the typing speed
        if (timestamp - lastUpdateTime < minDelay) {
            requestAnimationFrame(typeNextChunk);
            return;
        }
        lastUpdateTime = timestamp;
        
        // Type next chunk of characters
        const nextCharIndex = Math.min(charIndex + typingSpeed, fullMessage.length);
        const currentText = fullMessage.substring(0, nextCharIndex);
        messageContentEl.textContent = currentText;
        charIndex = nextCharIndex;
        
        // Scroll to see the typing
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        // Continue typing or finish
        if (charIndex < fullMessage.length) {
            requestAnimationFrame(typeNextChunk);
        } else {
            // Once typing is complete, apply formatting
            messageContentEl.innerHTML = formattedMessage;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }
    
    // Start typing animation
    requestAnimationFrame(typeNextChunk);
}

// Format message with markdown-like syntax
function formatMessage(message) {
    return message
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br>');
}

// Add message to chat UI (without typing effect)
function addMessageToUI(message, role) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    
    // Add avatar
    const avatarEl = document.createElement('div');
    avatarEl.className = 'avatar';
    avatarEl.innerHTML = role === 'user' 
        ? '<i class="fas fa-user"></i>' 
        : '<i class="fas fa-robot"></i>';
    
    // Format message with markdown-like syntax
    let formattedMessage = formatMessage(message);
    
    // Add message content
    const messageContentEl = document.createElement('div');
    messageContentEl.className = 'message';
    messageContentEl.innerHTML = formattedMessage;
    
    // Assemble message
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(messageContentEl);
    
    // Add to chat history
    chatHistory.appendChild(messageEl);
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Fetch AI response from Gemini API
async function fetchGeminiResponse() {
    // Format messages for Gemini API
    const messages = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));
    
    // Prepare the request for Gemini
    const requestBody = {
        contents: messages,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        }
    };
    
    // Call Gemini API
    const url = `${CHAT_API_CONFIG.baseUrl}:generateContent?key=${CHAT_API_CONFIG.apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract response text from Gemini format
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
    
    return responseText;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initAiChat);
