// Main application logic

// Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const themeSwitch = document.getElementById('theme-switch');

// Initialize
function initApp() {
    // Set up tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // Set up theme toggling
    themeSwitch.addEventListener('click', toggleTheme);
    
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeIcon();
    }
    
    // Initialize shared notification system
    initNotifications();
}

// Switch between tabs
function switchTab(tabName) {
    // Update active tab button
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show selected tab content
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Toggle between light and dark themes
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    updateThemeIcon();
    
    // Save preference
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Update theme icon based on current theme
function updateThemeIcon() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    themeSwitch.innerHTML = isDarkTheme 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
}

// Initialize notification system
function initNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
        
        // Add styles for notifications
        const style = document.createElement('style');
        style.textContent = `
            #notification-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .notification {
                padding: 12px 20px;
                border-radius: 8px;
                background-color: var(--surface);
                color: var(--text-primary);
                box-shadow: var(--shadow);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
                max-width: 300px;
            }
            
            .notification.success { border-left: 4px solid var(--success); }
            .notification.error { border-left: 4px solid var(--error); }
            .notification.info { border-left: 4px solid var(--primary-color); }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `${icon} <span>${message}</span>`;
    
    // Add to container
    container.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle API errors
function handleApiError(error, context) {
    console.error(`API Error (${context}):`, error);
    
    let errorMessage = 'Something went wrong. Please try again.';
    
    if (error.message && error.message.includes('API Error')) {
        errorMessage = error.message;
    } else if (error.message && error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
    }
    
    showNotification(errorMessage, 'error');
}

// Event listeners for form validation
function setupFormValidation() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.borderColor = this.value.trim() ? '' : 'var(--error)';
        });
    });
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupFormValidation();
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('Welcome to AI Creation Studio!', 'info');
    }, 1000);
});
