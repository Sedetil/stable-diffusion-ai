// Configuration
const CHAT_API_CONFIG = {
    apiKey: 'AIzaSyAtHg0tRxL2n4oOwnb6A679sAXkICrDtVM', // Store in environment variable in production
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash',
};

// Elements
const chatPromptInput = document.getElementById('chat-prompt');
const sendChatBtn = document.getElementById('send-chat');
const chatHistory = document.getElementById('chat-history');

// Chat history
let conversationHistory = [];

// Initialize
function initAiChat() {
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatPromptInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
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
    
    try {
        // Add to conversation history
        conversationHistory.push({ role: 'user', content: message });
        
        // Get AI response
        const response = await fetchGeminiResponse();
        
        // Add AI response to conversation history
        conversationHistory.push({ role: 'assistant', content: response });
        
        // Add AI response to UI
        addMessageToUI(response, 'system');
        
    } catch (error) {
        console.error('Error in chat:', error);
        addMessageToUI('Sorry, I encountered an error. Please try again later.', 'system');
    } finally {
        // Reset button
        sendChatBtn.disabled = false;
        sendChatBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
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

// Add message to chat UI
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
    let formattedMessage = message
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

// Initialize on load
document.addEventListener('DOMContentLoaded', initAiChat);
