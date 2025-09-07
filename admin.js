// Admin Panel JavaScript
const API_BASE_URL = window.location.origin + '/api';
let ws = null;
let isConnected = false;

// Get auth token
function getAuthToken() {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
    const token = getAuthToken();
    console.log('Auth token:', token ? 'Present' : 'Missing');
    return !!token;
}

// Redirect to login if not authenticated
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/admin-login.html';
        return false;
    }
    return true;
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuth()) {
        return;
    }
    
    // Add token to all requests
    addAuthHeaders();
    
    initializeAdminPanel();
    connectWebSocket();
    loadAllSettings();
    startRealTimeUpdates();
});

// Add authentication headers to all fetch requests
function addAuthHeaders() {
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        if (url.includes('/api/admin/') && !url.includes('/login')) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Bearer ${getAuthToken()}`;
        }
        return originalFetch(url, options);
    };
}

// Initialize admin panel
async function initializeAdminPanel() {
    // Check server health first
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
        console.warn('Server health check failed, some features may not work');
    }
    
    // Add event listeners for reaction previews
    setupReactionPreviews();
    

    
    // Load initial data
    loadDashboardData();
    loadAdsSettings();
    loadReactionsSettings();
    loadCredentialsSettings();
    loadApiSettings();
    loadMetadataSettings();
    loadPageTitlesSettings();
}

// Mobile menu functionality


// WebSocket connection for real-time updates
function connectWebSocket() {
    try {
        // Use current domain for WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log('Attempting WebSocket connection to:', wsUrl);
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
            console.log('WebSocket connected');
            isConnected = true;
            updateConnectionStatus(true);
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleRealTimeUpdate(data);
        };
        
        ws.onclose = function() {
            console.log('WebSocket disconnected');
            isConnected = false;
            // Check if API is still working before showing disconnected
            checkServerHealth().then(isHealthy => {
                updateConnectionStatus(isHealthy);
            });
            // Reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
            isConnected = false;
            // Check if API is still working before showing disconnected
            checkServerHealth().then(isHealthy => {
                updateConnectionStatus(isHealthy);
            });
        };
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        // Check if API is still working before showing disconnected
        checkServerHealth().then(isHealthy => {
            updateConnectionStatus(isHealthy);
        });
    }
}

// Handle real-time updates
function handleRealTimeUpdate(data) {
    switch(data.type) {
        case 'stats_update':
            updateDashboardStats(data.stats);
            break;
        case 'settings_update':
            loadAllSettings();
            showNotification('Settings updated in real-time', 'success');
            break;
        case 'activity_log':
            addActivityLog(data.activity);
            break;
        case 'system_status':
            updateSystemStatus(data.status);
            break;
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    const statusIndicator = document.getElementById('dbStatus');
    const statusText = document.getElementById('dbStatusText');
    
    if (statusIndicator && statusText) {
        if (connected) {
            statusIndicator.className = 'status-indicator status-online';
            statusText.textContent = 'Connected';
        } else {
            statusIndicator.className = 'status-indicator status-offline';
            statusText.textContent = 'Disconnected';
        }
    }
}

// Check server health
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            console.log('Server health check passed');
            return true;
        } else {
            console.log('Server health check failed');
            return false;
        }
    } catch (error) {
        console.error('Server health check error:', error);
        return false;
    }
}

// Show/hide sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
}

// Dashboard functions
async function loadDashboardData() {
    try {
        console.log('Loading dashboard data from:', `${API_BASE_URL}/admin/stats`);
        const response = await fetch(`${API_BASE_URL}/admin/stats`);
        console.log('Dashboard response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data received:', data);
        updateDashboardStats(data);
        
        // Load recent activity
        await loadRecentActivity();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Show fallback values
        updateDashboardStats({
            totalViews: 0,
            totalDownloads: 0,
            activeAds: 0,
            totalReactions: 0
        });
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/activity`);
        if (response.ok) {
            const activities = await response.json();
            const activityContainer = document.getElementById('recentActivity');
            if (activityContainer) {
                activityContainer.innerHTML = '';
                activities.forEach(activity => {
                    addActivityLog(activity);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load recent activity:', error);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalViews').textContent = stats.totalViews || 0;
    document.getElementById('totalDownloads').textContent = stats.totalDownloads || 0;
    document.getElementById('activeAds').textContent = stats.activeAds || 0;
    document.getElementById('totalReactions').textContent = stats.totalReactions || 0;
}

// Ads Management
async function loadAdsSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/ads`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Loaded ads settings:', data);
        
        // VAST Ads
        const preRollInput = document.getElementById('preRollAd');
        const midRollInput = document.getElementById('midRollAd');
        const postRollInput = document.getElementById('postRollAd');
        
        if (preRollInput) preRollInput.value = data.vast?.preRoll || '';
        if (midRollInput) midRollInput.value = data.vast?.midRoll || '';
        if (postRollInput) postRollInput.value = data.vast?.postRoll || '';
        
        // Banner Ads - Handle both old and new format
        const topBannerInput = document.getElementById('topBannerAd');
        const middleBannerInput = document.getElementById('middleBannerAd');
        const bottomBannerInput = document.getElementById('bottomBannerAd');
        const headerBannerInput = document.getElementById('headerBannerAd');
        const sidebarBannerInput = document.getElementById('sidebarBannerAd');
        const footerBannerInput = document.getElementById('footerBannerAd');
        const interstitialBannerInput = document.getElementById('interstitialBannerAd');
        
        // Check if data is in new format (data.banner) or old format (direct properties)
        if (data.banner) {
            // New format
            if (topBannerInput) topBannerInput.value = data.banner.top || '';
            if (middleBannerInput) middleBannerInput.value = data.banner.middle || '';
            if (bottomBannerInput) bottomBannerInput.value = data.banner.bottom || '';
            if (headerBannerInput) headerBannerInput.value = data.banner.header || '';
            if (sidebarBannerInput) sidebarBannerInput.value = data.banner.sidebar || '';
            if (footerBannerInput) footerBannerInput.value = data.banner.footer || '';
            if (interstitialBannerInput) interstitialBannerInput.value = data.banner.interstitial || '';
        } else {
            // Old format - data contains top, middle, bottom directly
            if (topBannerInput) topBannerInput.value = data.top || '';
            if (middleBannerInput) middleBannerInput.value = data.middle || '';
            if (bottomBannerInput) bottomBannerInput.value = data.bottom || '';
            if (headerBannerInput) headerBannerInput.value = data.header || '';
            if (sidebarBannerInput) sidebarBannerInput.value = data.sidebar || '';
            if (footerBannerInput) footerBannerInput.value = data.footer || '';
            if (interstitialBannerInput) interstitialBannerInput.value = data.interstitial || '';
        }
        
        console.log('Ads settings loaded successfully');
    } catch (error) {
        console.error('Failed to load ads settings:', error);
        showNotification('Failed to load ads settings', 'error');
    }
}

async function saveVastAds() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        const vastAds = {
            preRoll: document.getElementById('preRollAd').value,
            midRoll: document.getElementById('midRollAd').value,
            postRoll: document.getElementById('postRollAd').value
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/ads/vast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vastAds)
        });
        
        if (response.ok) {
            showNotification('VAST ads saved successfully!', 'success');
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'vast_ads' }));
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save VAST ads');
        }
    } catch (error) {
        console.error('Error saving VAST ads:', error);
        showNotification(error.message || 'Failed to save VAST ads', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

async function saveBannerAds() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        const bannerAds = {
            top: document.getElementById('topBannerAd').value,
            middle: document.getElementById('middleBannerAd').value,
            bottom: document.getElementById('bottomBannerAd').value,
            header: document.getElementById('headerBannerAd').value,
            sidebar: document.getElementById('sidebarBannerAd').value,
            footer: document.getElementById('footerBannerAd').value,
            interstitial: document.getElementById('interstitialBannerAd').value
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/ads/banner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bannerAds)
        });
        
        if (response.ok) {
            showNotification('Banner ads saved successfully!', 'success');
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'banner_ads' }));
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save banner ads');
        }
    } catch (error) {
        console.error('Error saving banner ads:', error);
        showNotification(error.message || 'Failed to save banner ads', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

// Reactions Management
function setupReactionPreviews() {
    const reactionInputs = [
        { emoji: 'likeReaction', label: 'likeLabel', preview: 'likePreview', labelPreview: 'likeLabelPreview' },
        { emoji: 'loveReaction', label: 'loveLabel', preview: 'lovePreview', labelPreview: 'loveLabelPreview' },
        { emoji: 'hahaReaction', label: 'hahaLabel', preview: 'hahaPreview', labelPreview: 'hahaLabelPreview' },
        { emoji: 'wowReaction', label: 'wowLabel', preview: 'wowPreview', labelPreview: 'wowLabelPreview' },
        { emoji: 'sadReaction', label: 'sadLabel', preview: 'sadPreview', labelPreview: 'sadLabelPreview' },
        { emoji: 'angryReaction', label: 'angryLabel', preview: 'angryPreview', labelPreview: 'angryLabelPreview' }
    ];
    
    reactionInputs.forEach(input => {
        const emojiInput = document.getElementById(input.emoji);
        const labelInput = document.getElementById(input.label);
        const preview = document.getElementById(input.preview);
        const labelPreview = document.getElementById(input.labelPreview);
        
        emojiInput.addEventListener('input', () => {
            preview.textContent = emojiInput.value;
        });
        
        labelInput.addEventListener('input', () => {
            labelPreview.textContent = labelInput.value;
        });
    });
}

async function loadReactionsSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/reactions`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Loaded reactions settings:', data);
        
        // Default reactions if none exist
        const defaultReactions = {
            like: { emoji: '👍', label: 'Like' },
            love: { emoji: '❤️', label: 'Love' },
            haha: { emoji: '😄', label: 'Haha' },
            wow: { emoji: '😮', label: 'Wow' },
            sad: { emoji: '😢', label: 'Sad' },
            angry: { emoji: '😠', label: 'Angry' }
        };
        
        // Use data from database or defaults
        const reactions = data && Object.keys(data).length > 0 ? data : defaultReactions;
        
        // Display reactions dynamically
        displayReactions(reactions);
        
        console.log('Reactions settings loaded successfully');
    } catch (error) {
        console.error('Failed to load reactions settings:', error);
        showNotification('Failed to load reactions settings', 'error');
    }
}

function displayReactions(reactions) {
    const container = document.getElementById('existingReactions');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(reactions).forEach(reactionKey => {
        const reaction = reactions[reactionKey];
        const reactionHtml = `
            <div class="form-group reaction-item" data-reaction-key="${reactionKey}">
                <div class="flex items-center justify-between mb-2">
                    <label class="capitalize">${reactionKey} Reaction</label>
                    <button class="btn-danger text-xs p-1" onclick="removeReaction('${reactionKey}')" title="Remove reaction">
                        🗑️
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    <input type="text" id="${reactionKey}Reaction" value="${reaction.emoji || ''}" placeholder="Emoji" onchange="updateReactionPreview('${reactionKey}')">
                    <input type="text" id="${reactionKey}Label" value="${reaction.label || ''}" placeholder="Label" onchange="updateReactionPreview('${reactionKey}')">
                    <div class="reaction-preview">
                        <span id="${reactionKey}Preview">${reaction.emoji || ''}</span>
                        <span id="${reactionKey}LabelPreview">${reaction.label || ''}</span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += reactionHtml;
    });
}

function updateReactionPreview(reactionKey) {
    const emojiInput = document.getElementById(`${reactionKey}Reaction`);
    const labelInput = document.getElementById(`${reactionKey}Label`);
    const emojiPreview = document.getElementById(`${reactionKey}Preview`);
    const labelPreview = document.getElementById(`${reactionKey}LabelPreview`);
    
    if (emojiPreview) emojiPreview.textContent = emojiInput.value;
    if (labelPreview) labelPreview.textContent = labelInput.value;
}

async function addNewReaction() {
    const keyInput = document.getElementById('newReactionKey');
    const emojiInput = document.getElementById('newReactionEmoji');
    const labelInput = document.getElementById('newReactionLabel');
    
    const key = keyInput.value.trim().toLowerCase();
    const emoji = emojiInput.value.trim();
    const label = labelInput.value.trim();
    
    if (!key || !emoji || !label) {
        showNotification('Please fill in all fields for the new reaction', 'error');
        return;
    }
    
    // Check if reaction already exists
    const existingReaction = document.querySelector(`[data-reaction-key="${key}"]`);
    if (existingReaction) {
        showNotification('A reaction with this key already exists', 'error');
        return;
    }
    
    // Add new reaction to the display
    const container = document.getElementById('existingReactions');
    const reactionHtml = `
        <div class="form-group reaction-item" data-reaction-key="${key}">
            <div class="flex items-center justify-between mb-2">
                <label class="capitalize">${key} Reaction</label>
                <button class="btn-danger text-xs p-1" onclick="removeReaction('${key}')" title="Remove reaction">
                    🗑️
                </button>
            </div>
            <div class="flex items-center gap-3">
                <input type="text" id="${key}Reaction" value="${emoji}" placeholder="Emoji" onchange="updateReactionPreview('${key}')">
                <input type="text" id="${key}Label" value="${label}" placeholder="Label" onchange="updateReactionPreview('${key}')">
                <div class="reaction-preview">
                    <span id="${key}Preview">${emoji}</span>
                    <span id="${key}LabelPreview">${label}</span>
                </div>
            </div>
        </div>
    `;
    container.innerHTML += reactionHtml;
    
    // Clear form
    keyInput.value = '';
    emojiInput.value = '';
    labelInput.value = '';
    
    showNotification('Reaction added! Auto-saving...', 'success');
    
    // Auto-save the changes
    try {
        // Collect all reactions from the DOM
        const reactions = {};
        const reactionElements = document.querySelectorAll('.reaction-item');
        
        reactionElements.forEach(element => {
            const reactionKey = element.getAttribute('data-reaction-key');
            const emojiInput = document.getElementById(`${reactionKey}Reaction`);
            const labelInput = document.getElementById(`${reactionKey}Label`);
            
            if (emojiInput && labelInput) {
                reactions[reactionKey] = {
                    emoji: emojiInput.value.trim(),
                    label: labelInput.value.trim()
                };
            }
        });
        
        // Save to database immediately
        const response = await fetch(`${API_BASE_URL}/admin/reactions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(reactions)
        });
        
        if (response.ok) {
            console.log('Reactions auto-saved after addition');
            showNotification('Reaction added and saved successfully!', 'success');
            // Reload to ensure sync
            await loadReactionsSettings();
        }
    } catch (error) {
        console.error('Error auto-saving reactions:', error);
        showNotification('Reaction added but failed to save automatically. Please click "Save All Reactions".', 'warning');
    }
}

async function removeReaction(reactionKey) {
    const reactionElement = document.querySelector(`[data-reaction-key="${reactionKey}"]`);
    if (reactionElement) {
        reactionElement.remove();
        showNotification(`Reaction "${reactionKey}" removed! Click "Save All Reactions" to save.`, 'success');
        
        // Auto-save the changes
        try {
            // Collect all remaining reactions from the DOM
            const reactions = {};
            const reactionElements = document.querySelectorAll('.reaction-item');
            
            reactionElements.forEach(element => {
                const key = element.getAttribute('data-reaction-key');
                const emojiInput = document.getElementById(`${key}Reaction`);
                const labelInput = document.getElementById(`${key}Label`);
                
                if (emojiInput && labelInput) {
                    reactions[key] = {
                        emoji: emojiInput.value.trim(),
                        label: labelInput.value.trim()
                    };
                }
            });
            
            // Save to database immediately
            const response = await fetch(`${API_BASE_URL}/admin/reactions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(reactions)
            });
            
            if (response.ok) {
                console.log('Reactions auto-saved after removal');
                // Reload to ensure sync
                await loadReactionsSettings();
            }
        } catch (error) {
            console.error('Error auto-saving reactions:', error);
        }
    }
}

async function saveReactions() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        // Collect all reactions from the DOM
        const reactions = {};
        const reactionElements = document.querySelectorAll('.reaction-item');
        
        reactionElements.forEach(element => {
            const reactionKey = element.getAttribute('data-reaction-key');
            const emojiInput = document.getElementById(`${reactionKey}Reaction`);
            const labelInput = document.getElementById(`${reactionKey}Label`);
            
            if (emojiInput && labelInput) {
                reactions[reactionKey] = {
                    emoji: emojiInput.value.trim(),
                    label: labelInput.value.trim()
                };
            }
        });
        
        // Validate that we have at least one reaction
        if (Object.keys(reactions).length === 0) {
            throw new Error('At least one reaction is required');
        }
        
        const response = await fetch(`${API_BASE_URL}/admin/reactions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(reactions)
        });
        
        if (response.ok) {
            showNotification('Reactions saved successfully!', 'success');
            
            // Reload reactions from database to sync display
            await loadReactionsSettings();
            
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'reactions' }));
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save reactions');
        }
    } catch (error) {
        console.error('Error saving reactions:', error);
        showNotification(error.message || 'Failed to save reactions', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

// Credentials Management
async function loadCredentialsSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/credentials`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        const data = await response.json();
        
        document.getElementById('databaseUri').value = data.databaseUri || '';
        document.getElementById('databaseName').value = data.databaseName || '';
    } catch (error) {
        console.error('Failed to load credentials settings:', error);
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Changing...';
    loadingBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/credentials/password`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        if (response.ok) {
            showNotification('Password changed successfully!', 'success');
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification(error.message || 'Failed to change password', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

// Database type toggle
document.addEventListener('DOMContentLoaded', function() {
    const dbTypeSelect = document.getElementById('dbType');
    const atlasFields = document.getElementById('atlasFields');
    const localFields = document.getElementById('localFields');
    
    if (dbTypeSelect) {
        dbTypeSelect.addEventListener('change', function() {
            if (this.value === 'atlas') {
                atlasFields.classList.remove('hidden');
                localFields.classList.add('hidden');
            } else {
                atlasFields.classList.add('hidden');
                localFields.classList.remove('hidden');
            }
        });
    }
});

async function generateConnectionString() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Generating...';
    loadingBtn.disabled = true;
    
    try {
        const dbType = document.getElementById('dbType').value;
        let requestData = { type: dbType };
        
        if (dbType === 'atlas') {
            requestData = {
                ...requestData,
                username: document.getElementById('atlasUsername').value,
                password: document.getElementById('atlasPassword').value,
                cluster: document.getElementById('atlasCluster').value,
                database: document.getElementById('atlasDatabase').value
            };
        } else {
            requestData = {
                ...requestData,
                host: document.getElementById('localHost').value,
                port: document.getElementById('localPort').value,
                username: document.getElementById('localUsername').value,
                password: document.getElementById('localPassword').value,
                database: document.getElementById('localDatabase').value
            };
        }
        
        const response = await fetch(`${API_BASE_URL}/admin/credentials/generate-connection`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('generatedConnectionString').value = data.connectionString;
            document.getElementById('generatedConnection').classList.remove('hidden');
            showNotification('Connection string generated successfully!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate connection string');
        }
        
    } catch (error) {
        console.error('Generate connection string error:', error);
        showNotification(error.message, 'error');
    } finally {
        loadingBtn.disabled = false;
        loadingBtn.textContent = originalText;
    }
}

function useGeneratedConnection() {
    const connectionString = document.getElementById('generatedConnectionString').value;
    const databaseName = document.getElementById('dbType').value === 'atlas' 
        ? document.getElementById('atlasDatabase').value 
        : document.getElementById('localDatabase').value;
    
    document.getElementById('databaseUri').value = connectionString;
    document.getElementById('databaseName').value = databaseName;
    
    showNotification('Connection string applied to database settings!', 'success');
}

async function saveDatabaseSettings() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        const settings = {
            databaseUri: document.getElementById('databaseUri').value,
            databaseName: document.getElementById('databaseName').value
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/credentials/database`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(result.message, 'success');
            
            // Show migration result if available
            if (result.migrationResult) {
                console.log('Migration result:', result.migrationResult);
            }
            
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'database' }));
            }
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save database settings');
        }
    } catch (error) {
        console.error('Error saving database settings:', error);
        showNotification(error.message, 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

// API Settings
async function loadApiSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/api`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Loaded API settings:', data);
        
        const apiBaseUrlInput = document.getElementById('apiBaseUrl');
        const apiKeyInput = document.getElementById('apiKey');
        const serverPortInput = document.getElementById('serverPort');
        const environmentInput = document.getElementById('environment');
        
        if (apiBaseUrlInput) apiBaseUrlInput.value = data.apiBaseUrl || 'https://camgrabber.onrender.com';
        if (apiKeyInput) apiKeyInput.value = data.apiKey || '';
        if (serverPortInput) serverPortInput.value = data.serverPort || 3000;
        if (environmentInput) environmentInput.value = data.environment || 'development';
        
        console.log('API settings loaded successfully');
    } catch (error) {
        console.error('Failed to load API settings:', error);
        showNotification('Failed to load API settings', 'error');
    }
}

async function saveApiSettings() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        const settings = {
            apiBaseUrl: document.getElementById('apiBaseUrl').value,
            apiKey: document.getElementById('apiKey').value
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/api`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            showNotification('API settings saved successfully!', 'success');
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'api' }));
            }
        } else {
            throw new Error('Failed to save API settings');
        }
    } catch (error) {
        console.error('Error saving API settings:', error);
        showNotification('Failed to save API settings', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

async function saveServerSettings() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        const settings = {
            serverPort: parseInt(document.getElementById('serverPort').value),
            environment: document.getElementById('environment').value
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/server`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            showNotification('Server settings saved successfully!', 'success');
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'server' }));
            }
        } else {
            throw new Error('Failed to save server settings');
        }
    } catch (error) {
        console.error('Error saving server settings:', error);
        showNotification('Failed to save server settings', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

// Utility functions
function loadAllSettings() {
    loadAdsSettings();
    loadReactionsSettings();
    loadCredentialsSettings();
    loadApiSettings();
    loadMetadataSettings();
    loadPageTitlesSettings();
}

function startRealTimeUpdates() {
    // Update dashboard every 30 seconds
    setInterval(loadDashboardData, 30000);
    
    // Update system status every 10 seconds
    setInterval(updateSystemStatus, 10000);
    
    // Check server health every 60 seconds
    setInterval(async () => {
        const isHealthy = await checkServerHealth();
        if (!isHealthy && isConnected) {
            console.log('Server health check failed, updating connection status');
            updateConnectionStatus(false);
        }
    }, 60000);
}

function updateSystemStatus() {
    // This would check various system components
    // For now, we'll just update the connection status
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
    }
}

function addActivityLog(activity) {
    const activityContainer = document.getElementById('recentActivity');
    const activityItem = document.createElement('div');
    activityItem.className = 'flex items-center justify-between p-3 bg rgba(255, 255, 255, 0.05) rounded';
    activityItem.innerHTML = `
        <span>${activity.message}</span>
        <span class="text-sm opacity-70">${new Date(activity.timestamp).toLocaleTimeString()}</span>
    `;
    
    activityContainer.insertBefore(activityItem, activityContainer.firstChild);
    
    // Keep only last 10 activities
    while (activityContainer.children.length > 10) {
        activityContainer.removeChild(activityContainer.lastChild);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function logout() {
    // Clear any stored credentials
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    
    // Redirect to login page
    window.location.href = '/admin-login.html';
}

// Metadata Management
async function loadMetadataSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/metadata`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Loaded metadata settings:', data);
        
        // Basic metadata
        const websiteTitleInput = document.getElementById('websiteTitle');
        const websiteDescriptionInput = document.getElementById('websiteDescription');
        const websiteKeywordsInput = document.getElementById('websiteKeywords');
        const websiteAuthorInput = document.getElementById('websiteAuthor');
        
        if (websiteTitleInput) websiteTitleInput.value = data.websiteTitle || '';
        if (websiteDescriptionInput) websiteDescriptionInput.value = data.websiteDescription || '';
        if (websiteKeywordsInput) websiteKeywordsInput.value = data.websiteKeywords || '';
        if (websiteAuthorInput) websiteAuthorInput.value = data.websiteAuthor || '';
        
        // Social media
        const ogTitleInput = document.getElementById('ogTitle');
        const ogDescriptionInput = document.getElementById('ogDescription');
        const ogImageInput = document.getElementById('ogImage');
        const twitterCardInput = document.getElementById('twitterCard');
        
        if (ogTitleInput) ogTitleInput.value = data.ogTitle || '';
        if (ogDescriptionInput) ogDescriptionInput.value = data.ogDescription || '';
        if (ogImageInput) ogImageInput.value = data.ogImage || '';
        if (twitterCardInput) twitterCardInput.value = data.twitterCard || 'summary';
        
        // Advanced settings
        const faviconUrlInput = document.getElementById('faviconUrl');
        const canonicalUrlInput = document.getElementById('canonicalUrl');
        const robotsMetaInput = document.getElementById('robotsMeta');
        const viewportMetaInput = document.getElementById('viewportMeta');
        
        if (faviconUrlInput) faviconUrlInput.value = data.faviconUrl || '';
        if (canonicalUrlInput) canonicalUrlInput.value = data.canonicalUrl || '';
        if (robotsMetaInput) robotsMetaInput.value = data.robotsMeta || 'index,follow';
        if (viewportMetaInput) viewportMetaInput.value = data.viewportMeta || 'width=device-width, initial-scale=1.0';
        
        // Analytics
        const googleAnalyticsIdInput = document.getElementById('googleAnalyticsId');
        const googleTagManagerIdInput = document.getElementById('googleTagManagerId');
        const customHeadScriptsInput = document.getElementById('customHeadScripts');
        const customBodyScriptsInput = document.getElementById('customBodyScripts');
        
        if (googleAnalyticsIdInput) googleAnalyticsIdInput.value = data.googleAnalyticsId || '';
        if (googleTagManagerIdInput) googleTagManagerIdInput.value = data.googleTagManagerId || '';
        if (customHeadScriptsInput) customHeadScriptsInput.value = data.customHeadScripts || '';
        if (customBodyScriptsInput) customBodyScriptsInput.value = data.customBodyScripts || '';
        
        console.log('Metadata settings loaded successfully');
    } catch (error) {
        console.error('Failed to load metadata settings:', error);
        showNotification('Failed to load metadata settings', 'error');
    }
}

async function saveMetadata() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        const metadata = {
            websiteTitle: document.getElementById('websiteTitle').value,
            websiteDescription: document.getElementById('websiteDescription').value,
            websiteKeywords: document.getElementById('websiteKeywords').value,
            websiteAuthor: document.getElementById('websiteAuthor').value,
            ogTitle: document.getElementById('ogTitle').value,
            ogDescription: document.getElementById('ogDescription').value,
            ogImage: document.getElementById('ogImage').value,
            twitterCard: document.getElementById('twitterCard').value,
            faviconUrl: document.getElementById('faviconUrl').value,
            canonicalUrl: document.getElementById('canonicalUrl').value,
            robotsMeta: document.getElementById('robotsMeta').value,
            viewportMeta: document.getElementById('viewportMeta').value,
            googleAnalyticsId: document.getElementById('googleAnalyticsId').value,
            googleTagManagerId: document.getElementById('googleTagManagerId').value,
            customHeadScripts: document.getElementById('customHeadScripts').value,
            customBodyScripts: document.getElementById('customBodyScripts').value
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata)
        });
        
        if (response.ok) {
            showNotification('Metadata saved successfully!', 'success');
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'metadata' }));
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save metadata');
        }
    } catch (error) {
        console.error('Error saving metadata:', error);
        showNotification(error.message || 'Failed to save metadata', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

function previewMetadata() {
    const previewDiv = document.getElementById('metadataPreview');
    const previewContent = document.getElementById('previewContent');
    
    const metadata = {
        title: document.getElementById('websiteTitle').value || 'Video Streaming App',
        description: document.getElementById('websiteDescription').value || 'Stream and download videos from various sources',
        keywords: document.getElementById('websiteKeywords').value || 'video, streaming, download, mp4',
        author: document.getElementById('websiteAuthor').value || 'Admin',
        ogTitle: document.getElementById('ogTitle').value || document.getElementById('websiteTitle').value || 'Video Streaming App',
        ogDescription: document.getElementById('ogDescription').value || document.getElementById('websiteDescription').value || 'Stream and download videos from various sources',
        ogImage: document.getElementById('ogImage').value || '',
        twitterCard: document.getElementById('twitterCard').value || 'summary'
    };
    
    const previewHTML = `
        <div class="bg-white text-black p-4 rounded">
            <h4 class="font-bold mb-2">Page Title:</h4>
            <p class="mb-4">${metadata.title}</p>
            
            <h4 class="font-bold mb-2">Meta Description:</h4>
            <p class="mb-4">${metadata.description}</p>
            
            <h4 class="font-bold mb-2">Keywords:</h4>
            <p class="mb-4">${metadata.keywords}</p>
            
            <h4 class="font-bold mb-2">Open Graph Preview:</h4>
            <div class="border border-gray-300 rounded p-3 mb-4">
                <div class="font-bold text-blue-600">${metadata.ogTitle}</div>
                <div class="text-gray-600">${metadata.ogDescription}</div>
                ${metadata.ogImage ? `<img src="${metadata.ogImage}" alt="OG Image" class="mt-2 max-w-xs">` : ''}
            </div>
            
            <h4 class="font-bold mb-2">Twitter Card:</h4>
            <p>${metadata.twitterCard}</p>
        </div>
    `;
    
    previewContent.innerHTML = previewHTML;
    previewDiv.classList.remove('hidden');
}

function resetMetadata() {
    if (confirm('Are you sure you want to reset all metadata to default values?')) {
        // Reset to default values
        document.getElementById('websiteTitle').value = 'Video Streaming App';
        document.getElementById('websiteDescription').value = 'Stream and download videos from various sources';
        document.getElementById('websiteKeywords').value = 'video, streaming, download, mp4';
        document.getElementById('websiteAuthor').value = '';
        document.getElementById('ogTitle').value = 'Video Streaming App';
        document.getElementById('ogDescription').value = 'Stream and download videos from various sources';
        document.getElementById('ogImage').value = '';
        document.getElementById('twitterCard').value = 'summary';
        document.getElementById('faviconUrl').value = '';
        document.getElementById('canonicalUrl').value = '';
        document.getElementById('robotsMeta').value = 'index,follow';
        document.getElementById('viewportMeta').value = 'width=device-width, initial-scale=1.0';
        document.getElementById('googleAnalyticsId').value = '';
        document.getElementById('googleTagManagerId').value = '';
        document.getElementById('customHeadScripts').value = '';
        document.getElementById('customBodyScripts').value = '';
        
        showNotification('Metadata reset to default values', 'success');
    }
}

// Page Titles Management
async function loadPageTitlesSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/page_titles`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Loaded page titles settings:', data);
        
        // Homepage
        const homepageTitleInput = document.getElementById('homepageTitle');
        const homepageSubtitleInput = document.getElementById('homepageSubtitle');
        
        if (homepageTitleInput) homepageTitleInput.value = data.homepage?.title || 'YouTube Video Downloader';
        if (homepageSubtitleInput) homepageSubtitleInput.value = data.homepage?.subtitle || 'Download YouTube videos in high quality for free';
        
        // Streaming page
        const streamingTitleInput = document.getElementById('streamingTitle');
        const streamingSubtitleInput = document.getElementById('streamingSubtitle');
        
        if (streamingTitleInput) streamingTitleInput.value = data.streaming?.title || 'Video Streaming';
        if (streamingSubtitleInput) streamingSubtitleInput.value = data.streaming?.subtitle || 'Watch and download videos in high quality';
        
        // Admin panel
        const adminTitleInput = document.getElementById('adminTitle');
        const adminSubtitleInput = document.getElementById('adminSubtitle');
        
        if (adminTitleInput) adminTitleInput.value = data.admin?.title || 'Admin Dashboard';
        if (adminSubtitleInput) adminSubtitleInput.value = data.admin?.subtitle || 'Manage your application settings';
        
        // Login page
        const loginTitleInput = document.getElementById('loginTitle');
        const loginSubtitleInput = document.getElementById('loginSubtitle');
        
        if (loginTitleInput) loginTitleInput.value = data.login?.title || 'Admin Login';
        if (loginSubtitleInput) loginSubtitleInput.value = data.login?.subtitle || 'Enter your credentials to access the admin panel';
        
        console.log('Page titles settings loaded successfully');
    } catch (error) {
        console.error('Failed to load page titles settings:', error);
        showNotification('Failed to load page titles settings', 'error');
    }
}

async function savePageTitles() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.innerHTML = '<span class="loading"></span> Saving...';
    loadingBtn.disabled = true;
    
    try {
        const pageTitles = {
            homepage: {
                title: document.getElementById('homepageTitle').value,
                subtitle: document.getElementById('homepageSubtitle').value
            },
            streaming: {
                title: document.getElementById('streamingTitle').value,
                subtitle: document.getElementById('streamingSubtitle').value
            },
            admin: {
                title: document.getElementById('adminTitle').value,
                subtitle: document.getElementById('adminSubtitle').value
            },
            login: {
                title: document.getElementById('loginTitle').value,
                subtitle: document.getElementById('loginSubtitle').value
            }
        };
        
        const response = await fetch(`${API_BASE_URL}/admin/page_titles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pageTitles)
        });
        
        if (response.ok) {
            showNotification('Page titles saved successfully!', 'success');
            // Send real-time update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'settings_update', section: 'page_titles' }));
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save page titles');
        }
    } catch (error) {
        console.error('Error saving page titles:', error);
        showNotification(error.message || 'Failed to save page titles', 'error');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

function previewPageTitles() {
    const previewDiv = document.getElementById('pageTitlesPreview');
    const previewContent = document.getElementById('pageTitlesPreviewContent');
    
    const pageTitles = {
        homepage: {
            title: document.getElementById('homepageTitle').value || 'YouTube Video Downloader',
            subtitle: document.getElementById('homepageSubtitle').value || 'Download YouTube videos in high quality for free'
        },
        streaming: {
            title: document.getElementById('streamingTitle').value || 'Video Streaming',
            subtitle: document.getElementById('streamingSubtitle').value || 'Watch and download videos in high quality'
        },
        admin: {
            title: document.getElementById('adminTitle').value || 'Admin Dashboard',
            subtitle: document.getElementById('adminSubtitle').value || 'Manage your application settings'
        },
        login: {
            title: document.getElementById('loginTitle').value || 'Admin Login',
            subtitle: document.getElementById('loginSubtitle').value || 'Enter your credentials to access the admin panel'
        }
    };
    
    const previewHTML = `
        <div class="space-y-4">
            <div class="border-b border-gray-600 pb-4">
                <h4 class="font-bold text-blue-400 mb-2">🏠 Homepage</h4>
                <p class="text-white font-semibold">${pageTitles.homepage.title}</p>
                <p class="text-gray-300 text-sm">${pageTitles.homepage.subtitle}</p>
            </div>
            <div class="border-b border-gray-600 pb-4">
                <h4 class="font-bold text-blue-400 mb-2">🎬 Streaming Page</h4>
                <p class="text-white font-semibold">${pageTitles.streaming.title}</p>
                <p class="text-gray-300 text-sm">${pageTitles.streaming.subtitle}</p>
            </div>
            <div class="border-b border-gray-600 pb-4">
                <h4 class="font-bold text-blue-400 mb-2">⚙️ Admin Panel</h4>
                <p class="text-white font-semibold">${pageTitles.admin.title}</p>
                <p class="text-gray-300 text-sm">${pageTitles.admin.subtitle}</p>
            </div>
            <div>
                <h4 class="font-bold text-blue-400 mb-2">🔐 Login Page</h4>
                <p class="text-white font-semibold">${pageTitles.login.title}</p>
                <p class="text-gray-300 text-sm">${pageTitles.login.subtitle}</p>
            </div>
        </div>
    `;
    
    previewContent.innerHTML = previewHTML;
    previewDiv.classList.remove('hidden');
}

function resetPageTitles() {
    if (confirm('Are you sure you want to reset all page titles to default values?')) {
        // Reset to default values
        document.getElementById('homepageTitle').value = 'YouTube Video Downloader';
        document.getElementById('homepageSubtitle').value = 'Download YouTube videos in high quality for free';
        document.getElementById('streamingTitle').value = 'Video Streaming';
        document.getElementById('streamingSubtitle').value = 'Watch and download videos in high quality';
        document.getElementById('adminTitle').value = 'Admin Dashboard';
        document.getElementById('adminSubtitle').value = 'Manage your application settings';
        document.getElementById('loginTitle').value = 'Admin Login';
        document.getElementById('loginSubtitle').value = 'Enter your credentials to access the admin panel';
        
        showNotification('Page titles reset to default values', 'success');
    }
} 