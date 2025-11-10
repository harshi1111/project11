// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// State Management
let appState = {
    authenticated: false,
    user: null,
    messageCount: 0,
    totalResponseTime: 0
};

// DOM Elements
const authModal = document.getElementById('authModal');
const mainContainer = document.getElementById('mainContainer');
const loginStep = document.getElementById('loginStep');
const verifyStep = document.getElementById('verifyStep');
const authStatus = document.getElementById('authStatus');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const uploadModal = document.getElementById('uploadModal');
const uploadArea = document.getElementById('uploadArea');
const documentFile = document.getElementById('documentFile');
const uploadResult = document.getElementById('uploadResult');
const connectionStatus = document.getElementById('connectionStatus');
const responseTimeElement = document.getElementById('responseTime');
const messageCountElement = document.getElementById('messageCount');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkExistingAuth();
});

function initializeApp() {
    // Check if user is already authenticated
    checkExistingAuth();
}

function setupEventListeners() {
    // Authentication
    document.getElementById('sendCodeBtn').addEventListener('click', initiate2FA);
    document.getElementById('verifyCodeBtn').addEventListener('click', verify2FACode);
    document.getElementById('backToEmailBtn').addEventListener('click', backToEmail);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Chat
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Quick actions
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.getAttribute('data-query');
            userInput.value = query;
            sendMessage();
        });
    });

    // Card buttons
    document.querySelectorAll('.card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.getAttribute('data-query');
            if (query) {
                userInput.value = query;
                sendMessage();
            }
        });
    });

    // Document upload
    document.getElementById('uploadDocumentBtn').addEventListener('click', showUploadModal);
    document.getElementById('closeUploadModal').addEventListener('click', hideUploadModal);
    document.getElementById('browseBtn').addEventListener('click', () => documentFile.click());
    documentFile.addEventListener('change', handleFileSelect);
    
    // Drag and drop for file upload
    setupDragAndDrop();
}

function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function highlight() {
        uploadArea.style.borderColor = '#6c63ff';
        uploadArea.style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
    }

    function unhighlight() {
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        uploadArea.style.backgroundColor = 'transparent';
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        documentFile.files = files;
        handleFileSelect();
    }
}

// Authentication Functions
async function checkExistingAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/user-info`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                appState.authenticated = true;
                appState.user = data.user;
                showMainApp();
            } else {
                showAuthModal();
            }
        } else {
            showAuthModal();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthModal();
    }
}

function showAuthModal() {
    authModal.style.display = 'flex';
    mainContainer.style.display = 'none';
}

function showMainApp() {
    authModal.style.display = 'none';
    mainContainer.style.display = 'block';
    updateUserInfo();
}

async function initiate2FA() {
    const email = document.getElementById('email').value.trim();
    
    if (!email || !isValidEmail(email)) {
        showAuthStatus('Please enter a valid organization email', 'error');
        return;
    }

    showAuthStatus('Sending verification code...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/initiate-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            document.getElementById('userEmail').textContent = email;
            loginStep.classList.remove('active');
            verifyStep.classList.add('active');
            showAuthStatus('Verification code sent to your email', 'success');
        } else {
            showAuthStatus(data.message, 'error');
        }
    } catch (error) {
        showAuthStatus('Failed to send verification code. Please try again.', 'error');
    }
}

async function verify2FACode() {
    const email = document.getElementById('email').value.trim();
    const code = document.getElementById('verificationCode').value.trim();
    
    if (!code || code.length !== 6) {
        showAuthStatus('Please enter a valid 6-digit code', 'error');
        return;
    }

    showAuthStatus('Verifying code...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, code })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showAuthStatus('Authentication successful!', 'success');
            setTimeout(() => {
                appState.authenticated = true;
                showMainApp();
                checkExistingAuth(); // Get user info
            }, 1000);
        } else {
            showAuthStatus(data.message, 'error');
        }
    } catch (error) {
        showAuthStatus('Verification failed. Please try again.', 'error');
    }
}

function backToEmail() {
    verifyStep.classList.remove('active');
    loginStep.classList.add('active');
    authStatus.style.display = 'none';
}

function showAuthStatus(message, type) {
    authStatus.textContent = message;
    authStatus.className = `auth-status ${type}`;
    authStatus.style.display = 'block';
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        appState.authenticated = false;
        appState.user = null;
        showAuthModal();
        clearChat();
        resetAuthForm();
    }
}

function resetAuthForm() {
    document.getElementById('email').value = '';
    document.getElementById('verificationCode').value = '';
    loginStep.classList.add('active');
    verifyStep.classList.remove('active');
    authStatus.style.display = 'none';
}

function updateUserInfo() {
    if (appState.user) {
        userName.textContent = `${appState.user.name} - ${appState.user.department}`;
    }
}

// Chat Functions
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        const responseTime = Date.now() - startTime;

        // Remove typing indicator
        removeTypingIndicator();

        if (data.status === 'success') {
            addMessageToChat(data.response, 'bot', {
                confidence: data.confidence,
                category: data.category,
                processingTime: data.processing_time
            });
            
            // Update statistics
            updateStatistics(responseTime);
        } else {
            addMessageToChat(`Error: ${data.message}`, 'bot');
        }
    } catch (error) {
        removeTypingIndicator();
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
        console.error('Chat error:', error);
    }
}

function addMessageToChat(text, sender, metadata = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const avatarIcon = document.createElement('i');
    avatarIcon.className = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
    avatarDiv.appendChild(avatarIcon);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const contentP = document.createElement('p');
    contentP.textContent = text;
    contentDiv.appendChild(contentP);

    // Add metadata for bot messages
    if (sender === 'bot' && metadata.confidence) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        metaDiv.innerHTML = `Confidence: ${(metadata.confidence * 100).toFixed(1)}% | Category: ${metadata.category} | Time: ${metadata.processingTime}s`;
        contentDiv.appendChild(metaDiv);
    }
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (sender === 'user') {
        appState.messageCount++;
        updateMessageCount();
    }
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function updateStatistics(responseTime) {
    appState.totalResponseTime += responseTime;
    const avgResponseTime = appState.totalResponseTime / appState.messageCount;
    responseTimeElement.textContent = `Avg response: ${avgResponseTime.toFixed(0)}ms`;
}

function updateMessageCount() {
    messageCountElement.textContent = `Messages: ${appState.messageCount}`;
}

function clearChat() {
    chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>Hello! I'm your secure Intelligent Enterprise Assistant. I can help with HR policies, IT support, document processing, and organizational information.</p>
            </div>
        </div>
    `;
    appState.messageCount = 0;
    appState.totalResponseTime = 0;
    updateMessageCount();
    responseTimeElement.textContent = 'Response time: --';
}

// Document Upload Functions
function showUploadModal() {
    uploadModal.style.display = 'flex';
    uploadResult.classList.remove('show');
    uploadResult.innerHTML = '';
}

function hideUploadModal() {
    uploadModal.style.display = 'none';
    documentFile.value = '';
}

function handleFileSelect() {
    const file = documentFile.files[0];
    if (file) {
        // Validate file type
        const validTypes = ['.pdf', '.docx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExtension)) {
            showUploadResult('Please select a PDF, DOCX, or TXT file.', 'error');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showUploadResult('File size must be less than 10MB.', 'error');
            return;
        }

        uploadDocument(file);
    }
}

async function uploadDocument(file) {
    showUploadResult('Processing document...', 'info');
    
    const formData = new FormData();
    formData.append('document', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/process-document`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayDocumentResults(data.result, file.name);
        } else {
            showUploadResult(`Error: ${data.message}`, 'error');
        }
    } catch (error) {
        showUploadResult('Failed to process document. Please try again.', 'error');
        console.error('Upload error:', error);
    }
}

function displayDocumentResults(result, fileName) {
    let html = `
        <h3><i class="fas fa-file-alt"></i> Analysis Results: ${fileName}</h3>
        <div class="result-section">
            <h4>Document Summary</h4>
            <p>${result.summary}</p>
        </div>
        <div class="result-section">
            <h4>Key Information</h4>
            <div class="document-stats">
                <span><strong>Pages:</strong> ${result.page_count}</span>
                <span><strong>Words:</strong> ${result.word_count}</span>
            </div>
            <div class="keywords">
                <strong>Key Topics:</strong>
                <div class="keyword-list">
                    ${result.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
                </div>
            </div>
        </div>
        <div class="result-section">
            <h4>Extracted Text (Preview)</h4>
            <div class="text-preview">
                ${result.full_text}
            </div>
        </div>
    `;
    
    uploadResult.innerHTML = html;
    uploadResult.classList.add('show');
}

function showUploadResult(message, type) {
    const color = type === 'error' ? '#f87171' : type === 'success' ? '#4ade80' : '#4cc9f0';
    uploadResult.innerHTML = `<p style="color: ${color}; text-align: center;">${message}</p>`;
    uploadResult.classList.add('show');
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Health check and connection monitoring
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            connectionStatus.textContent = 'Online';
            connectionStatus.style.color = '#4ade80';
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        connectionStatus.textContent = 'Offline';
        connectionStatus.style.color = '#f87171';
    }
}

// Check connection every 30 seconds
setInterval(checkConnection, 30000);
checkConnection();