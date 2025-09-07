// API Configuration
let API_BASE_URL = ''; // Will be set dynamically

// Load API settings from database
async function loadApiSettings() {
    try {
        const response = await fetch('/api/settings/api_settings');
        if (response.ok) {
            const data = await response.json();
            API_BASE_URL = data.apiBaseUrl || API_BASE_URL;
        }
    } catch (error) {
        // Silent error handling
    }
}

// Load banner ads from database
async function loadBannerAds() {
    try {
        const response = await fetch('/api/settings/banner_ads');
        if (response.ok) {
            const data = await response.json();
            
            // Update adsData with database values (including empty ones)
            adsData.top[0].adCode = data.top || '';
            adsData.middle[0].adCode = data.middle || '';
            adsData.bottom[0].adCode = data.bottom || '';
            adsData.header[0].adCode = data.header || '';
            adsData.sidebar[0].adCode = data.sidebar || '';
            adsData.footer[0].adCode = data.footer || '';
            adsData.interstitial[0].adCode = data.interstitial || '';
        }
    } catch (error) {
        // Silent error handling
    }
}

// Load page titles from database
async function loadPageTitles() {
    try {
        const response = await fetch('/api/settings/page_titles');
        if (response.ok) {
            const data = await response.json();
            
            // Update page title for streaming page
            if (data.streaming?.title) {
                document.title = data.streaming.title;
            }
            
            // Update streaming page header
            const headerTitle = document.querySelector('#streamPage h1');
            const headerSubtitle = document.querySelector('#streamPage p');
            
            if (headerTitle && data.streaming?.title) {
                headerTitle.textContent = data.streaming.title;
            }
            if (headerSubtitle && data.streaming?.subtitle) {
                headerSubtitle.textContent = data.streaming.subtitle;
            }
        }
    } catch (error) {
        // Silent error handling
    }
}

// Load metadata from database
async function loadMetadata() {
    try {
        const response = await fetch('/api/settings/metadata');
        if (response.ok) {
            const data = await response.json();
            
            // Update meta tags
            const metaDescription = document.querySelector('meta[name="description"]');
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            const metaAuthor = document.querySelector('meta[name="author"]');
            
            if (metaDescription && data.websiteDescription) {
                metaDescription.setAttribute('content', data.websiteDescription);
            }
            if (metaKeywords && data.websiteKeywords) {
                metaKeywords.setAttribute('content', data.websiteKeywords);
            }
            if (metaAuthor && data.websiteAuthor) {
                metaAuthor.setAttribute('content', data.websiteAuthor);
            }
            
            // Update Open Graph tags
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const ogDescription = document.querySelector('meta[property="og:description"]');
            const ogImage = document.querySelector('meta[property="og:image"]');
            
            if (ogTitle && (data.ogTitle || data.websiteTitle)) {
                ogTitle.setAttribute('content', data.ogTitle || data.websiteTitle);
            }
            if (ogDescription && (data.ogDescription || data.websiteDescription)) {
                ogDescription.setAttribute('content', data.ogDescription || data.websiteDescription);
            }
            if (ogImage && data.ogImage) {
                ogImage.setAttribute('content', data.ogImage);
            }
            
            // Add favicon if specified
            if (data.faviconUrl) {
                const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
                favicon.rel = 'icon';
                favicon.href = data.faviconUrl;
                if (!document.querySelector('link[rel="icon"]')) {
                    document.head.appendChild(favicon);
                }
            }
        }
    } catch (error) {
        // Silent error handling
    }
}

// Tracking functions
async function trackView(fileId) {
    try {
        await fetch('/api/admin/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'view', fileId })
        });
    } catch (error) {
        // Silent error handling
    }
}

async function trackDownload(fileId) {
    try {
        await fetch('/api/admin/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'download', fileId })
        });
    } catch (error) {
        // Silent error handling
    }
}

async function trackReaction(fileId) {
    try {
        await fetch('/api/admin/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reaction', fileId })
        });
    } catch (error) {
        // Silent error handling
    }
}

// Global variables
let currentVideoInfo = null;
let videoPlayer = null;

// DOM elements
const pages = {
    streamPage: document.getElementById('streamPage'),
    loadingPage: document.getElementById('loadingPage'),
    errorPage: document.getElementById('errorPage')
};

/* Removed duplicate adsData declaration */

// Ad data - using different ad codes for each position (like backup version)
const adsData = {
    top: [
        {
            id: 'top-1',
            adCode: `<script>(function(pbms){ var d = document, s = d.createElement('script'), l = d.scripts[d.scripts.length - 1]; s.settings = pbms || {}; s.src = "//distortedwin.com/btXIVRs/d.GMlK0fYjWMco/Fe/m/9du/ZPUmlhkJPbTUYn1BNuTeQpyRNkDuEjtbNvjdUD1zN/D/Io0/Mdgh"; s.async = true; s.referrerPolicy = 'no-referrer-when-downgrade'; l.parentNode.insertBefore(s, l); })({})<\/script>`,
            width: '100%',
            height: 'auto'
        }
    ],
    middle: [
        {
            id: 'middle-1',
            adCode: `<script>(function(xwtt){var d = document,s = d.createElement('script'),l = d.scripts[d.scripts.length - 1];s.settings = xwtt || {};s.src = "//distortedwin.com/bvX.VzscdqG-lX0/Y/WAcv/pevmB9tuAZyUblMkdP/ThYH1PNgTpkV3hOCDIcgtaNpjNUG1HONTCcc4gOZAn";s.async = true;s.referrerPolicy = 'no-referrer-when-downgrade';l.parentNode.insertBefore(s, l);})({})<\/script>`,
            width: '100%',
            height: 'auto'
        }
    ],
    bottom: [
        {
            id: 'bottom-1',
            adCode: `<script>(function(ryyxmdj){var d = document,s = d.createElement('script'),l = d.scripts[d.scripts.length - 1];s.settings = ryyxmdj || {};s.src = "//distortedwin.com/bPX.VHssdfG/lE0/YEWwc_/weFmO9/u/ZFUUlmkvPKTdYv1jN/TIU/xwNjjiUMtKNSj/Un1/NtTzEQ2_NBga";s.async = true;s.referrerPolicy = 'no-referrer-when-downgrade';l.parentNode.insertBefore(s, l);})({})<\/script>`,
            width: '100%',
            height: 'auto'
        }
    ],
    header: [
        {
            id: 'header-1',
            adCode: `<script>(function(header){var d = document,s = d.createElement('script'),l = d.scripts[d.scripts.length - 1];s.settings = header || {};s.src = "//distortedwin.com/header-ad-script";s.async = true;s.referrerPolicy = 'no-referrer-when-downgrade';l.parentNode.insertBefore(s, l);})({})<\/script>`,
            width: '100%',
            height: 'auto'
        }
    ],
    sidebar: [
        {
            id: 'sidebar-1',
            adCode: `<script>(function(sidebar){var d = document,s = d.createElement('script'),l = d.scripts[d.scripts.length - 1];s.settings = sidebar || {};s.src = "//distortedwin.com/sidebar-ad-script";s.async = true;s.referrerPolicy = 'no-referrer-when-downgrade';l.parentNode.insertBefore(s, l);})({})<\/script>`,
            width: '100%',
            height: 'auto'
        }
    ],
    footer: [
        {
            id: 'footer-1',
            adCode: `<script>(function(footer){var d = document,s = d.createElement('script'),l = d.scripts[d.scripts.length - 1];s.settings = footer || {};s.src = "//distortedwin.com/footer-ad-script";s.async = true;s.referrerPolicy = 'no-referrer-when-downgrade';l.parentNode.insertBefore(s, l);})({})<\/script>`,
            width: '100%',
            height: 'auto'
        }
    ],
    interstitial: [
        {
            id: 'interstitial-1',
            adCode: `<script>(function(interstitial){var d = document,s = d.createElement('script'),l = d.scripts[d.scripts.length - 1];s.settings = interstitial || {};s.src = "//distortedwin.com/interstitial-ad-script";s.async = true;s.referrerPolicy = 'no-referrer-when-downgrade';l.parentNode.insertBefore(s, l);})({})<\/script>`,
            width: '100%',
            height: '100%'
        }
    ]
};

// Ad management class (like backup version)
class AdManager {
    constructor(position) {
        this.position = position;
        this.ads = adsData[position] || [];
        this.currentIndex = 0;
        this.container = document.getElementById(`${position}-ad-content`);
        this.fallback = document.getElementById(`${position}-ad-fallback`);
        this.dots = document.getElementById(`${position}-ad-dots`);
        this.isMobile = this.detectMobile();
        this.adLoadTimeout = null;
        this.adLoadRetries = 0;
        this.maxRetries = 3;
        
        // Check if we have valid ad codes (not empty strings)
        const hasValidAds = this.ads.length > 0 && this.ads.some(ad => 
            ad.adCode && ad.adCode.trim() !== '' && 
            !ad.adCode.includes('header-ad-script') && 
            !ad.adCode.includes('sidebar-ad-script') && 
            !ad.adCode.includes('footer-ad-script') && 
            !ad.adCode.includes('interstitial-ad-script')
        );
        
        if (hasValidAds) {
            this.init();
        } else {
            // Don't hide containers for positions that might have VAST ads
            // Only hide fallback messages
            if (this.fallback) {
                this.fallback.style.display = 'none';
            }
            // Don't hide the entire ad banner - let VAST ads work
        }
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }

    init() {
        this.createDots();
        this.showAd();
        
        // Rotate ads every 5 seconds if multiple ads
        if (this.ads.length > 1) {
            setInterval(() => {
                this.nextAd();
            }, 5000);
        }
    }

    createDots() {
        if (this.ads.length > 1 && this.dots) {
            this.dots.innerHTML = '';
            this.ads.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `ad-dot ${index === 0 ? 'active' : 'inactive'}`;
                dot.onclick = () => this.showAd(index);
                this.dots.appendChild(dot);
            });
        }
    }

    showAd(index = 0) {
        this.currentIndex = index;
        const ad = this.ads[index];
        
        if (!ad || !this.container) return;

        // Clear previous timeout
        if (this.adLoadTimeout) {
            clearTimeout(this.adLoadTimeout);
        }

        // Clear container
        this.container.innerHTML = '';
        
        // Hide fallback
        if (this.fallback) {
            this.fallback.style.display = 'none';
        }

        // Show loading indicator for mobile
        if (this.isMobile) {
            this.showMobileLoadingIndicator();
        }

        // Create marker
        const marker = document.createElement('div');
        marker.id = `ad-marker-${ad.id}`;
        marker.style.display = 'none';
        document.body.appendChild(marker);

        // Inject ad script with mobile-specific handling
        const script = document.createElement('script');
        script.innerHTML = ad.adCode.replace(/<script>|<\/script>/g, '');
        
        // Add mobile-specific attributes for better mobile ad loading
        if (this.isMobile) {
            script.setAttribute('data-mobile', 'true');
            script.setAttribute('data-viewport', 'mobile');
            script.setAttribute('data-device', 'mobile');
        }
        
        // Add error handling for script loading
        script.onerror = () => {
            this.showFallback();
        };
        
        document.body.appendChild(script);

        // Enhanced content moving with mobile-specific timing
        const moveContent = () => {
            try {
                const markerElement = document.getElementById(`ad-marker-${ad.id}`);
                if (markerElement) {
                    let nextElement = markerElement.nextSibling;
                    let movedElements = 0;
                    
                    while (nextElement && nextElement !== script) {
                        const elementToMove = nextElement;
                        nextElement = nextElement.nextSibling;
                        if (elementToMove.nodeType === Node.ELEMENT_NODE) {
                            // Check if the element contains only a URL (common ad loading issue)
                            const elementText = elementToMove.textContent || elementToMove.innerText || '';
                            const isUrlOnly = this.isUrlOnly(elementText);
                            
                            if (isUrlOnly) {
                                continue; // Skip this element
                            }
                            
                            // Additional mobile-specific content validation
                            if (this.isMobile && this.isInvalidAdContent(elementToMove)) {
                                continue;
                            }
                            
                            this.container.appendChild(elementToMove);
                            movedElements++;
                        }
                    }
                    
                    markerElement.remove();
                    
                    // If we moved content, hide loading indicator
                    if (movedElements > 0 && this.isMobile) {
                        this.hideMobileLoadingIndicator();
                    }
                }
                if (script && script.parentNode) {
                    script.remove();
                }
            } catch (error) {
                // Silent error handling
            }
        };

        // Use longer timeout for mobile devices
        const timeout = this.isMobile ? 500 : 200;
        this.adLoadTimeout = setTimeout(moveContent, timeout);

        // Enhanced fallback mechanism
        const checkAdLoad = () => {
            if (this.container.children.length === 0) {
                if (this.adLoadRetries < this.maxRetries) {
                    this.adLoadRetries++;
                    this.adLoadTimeout = setTimeout(moveContent, timeout * 2);
                    this.adLoadTimeout = setTimeout(checkAdLoad, timeout * 3);
                } else {
                    this.showFallback();
                }
            } else {
                // Additional validation: check if we have real ad content
                const hasRealContent = this.validateAdContent();
                if (hasRealContent) {
                    this.adLoadRetries = 0; // Reset retries on success
                    if (this.isMobile) {
                        this.hideMobileLoadingIndicator();
                    }
                } else {
                    // Only show fallback if we have no valid content and no retries left
                    if (this.adLoadRetries >= this.maxRetries) {
                        this.showFallback();
                    } else {
                        // Try again
                        this.adLoadRetries++;
                        setTimeout(checkAdLoad, 1000);
                    }
                }
            }
        };

        // Check ad load status with mobile-specific timing
        const fallbackTimeout = this.isMobile ? 4000 : 3000;
        setTimeout(checkAdLoad, fallbackTimeout);

        // Update dots
        this.updateDots();
    }

    // Helper method to detect if content is just a URL
    isUrlOnly(text) {
        if (!text || typeof text !== 'string') return false;
        
        const trimmedText = text.trim();
        
        // Check if it's just a URL pattern
        const urlPatterns = [
            /^https?:\/\/[^\s]+$/i,
            /^\/\/[^\s]+$/i,
            /^cdn-fc\.com\/creatives\/universal\/dynamic\/\?[^\s]+$/i,
            /^distortedwin\.com\/[^\s]+$/i
        ];
        
        return urlPatterns.some(pattern => pattern.test(trimmedText));
    }

    // Helper method to detect invalid ad content for mobile
    isInvalidAdContent(element) {
        const elementText = element.textContent || element.innerText || '';
        const elementHtml = element.innerHTML || '';
        
        // Only reject content that is clearly invalid (URLs, loading messages)
        const invalidPatterns = [
            /^https?:\/\/[^\s]+$/i,  // Pure URLs
            /^\/\/[^\s]+$/i,         // Protocol-relative URLs
            /^cdn-fc\.com\/creatives\/universal\/dynamic\/\?[^\s]*$/i,  // Specific ad network URLs
            /^distortedwin\.com\/[^\s]*$/i,  // Specific ad network URLs
            /^Loading\.\.\.$/i,      // Just "Loading..."
            /^Ad loading\.\.\.$/i,   // Just "Ad loading..."
            /^Please wait\.\.\.$/i   // Just "Please wait..."
        ];
        
        // Check if the content matches any invalid pattern exactly
        return invalidPatterns.some(pattern => pattern.test(elementText.trim()));
    }

    // Helper method to validate ad content
    validateAdContent() {
        if (!this.container || this.container.children.length === 0) {
            return false;
        }
        
        let hasValidContent = false;
        
        for (let child of this.container.children) {
            const childText = child.textContent || child.innerText || '';
            const childHtml = child.innerHTML || '';
            
            // Skip if it's just a URL
            if (this.isUrlOnly(childText)) {
                child.remove();
                continue;
            }
            
            // Skip if it's clearly invalid content
            if (this.isInvalidAdContent(child)) {
                child.remove();
                continue;
            }
            
            // Consider content valid if it has any meaningful HTML or text
            if (childHtml.trim() !== '' && 
                !childHtml.includes('External ad content loading') &&
                !childHtml.includes('Loading advertisement') &&
                childText.length > 5) {  // Reduced minimum length requirement
                hasValidContent = true;
            }
        }
        
        return hasValidContent;
    }

    showMobileLoadingIndicator() {
        if (this.container) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = `${this.position}-loading`;
            loadingDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.8);">
                    <div style="width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                    <p style="margin: 0; font-size: 14px;">Loading advertisement...</p>
                </div>
            `;
            this.container.appendChild(loadingDiv);
        }
    }

    hideMobileLoadingIndicator() {
        const loadingDiv = document.getElementById(`${this.position}-loading`);
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showFallback() {
        if (this.fallback) {
            // Only show fallback if we have no content at all
            if (this.container && this.container.children.length === 0) {
                this.fallback.style.display = 'block';
                this.fallback.innerHTML = `
                    <h4 style="margin: 0 0 10px 0;">🎬 Advertisement</h4>
                    <p style="margin: 0; font-size: 14px;">${this.isMobile ? 'Mobile ad content loading...' : 'External ad content loading...'}</p>
                `;
            } else {
                // If we have any content, hide the fallback
                this.fallback.style.display = 'none';
            }
        }
        if (this.isMobile) {
            this.hideMobileLoadingIndicator();
        }
    }

    nextAd() {
        this.currentIndex = (this.currentIndex + 1) % this.ads.length;
        this.showAd(this.currentIndex);
    }

    updateDots() {
        if (this.dots) {
            const dotElements = this.dots.querySelectorAll('.ad-dot');
            dotElements.forEach((dot, index) => {
                dot.className = `ad-dot ${index === this.currentIndex ? 'active' : 'inactive'}`;
            });
        }
    }
}

// Initialize ads when page loads (like backup version)
document.addEventListener('DOMContentLoaded', async function() {
    // Load API settings and banner ads first
    await loadApiSettings();
    await loadBannerAds();
    await loadPageTitles();
    await loadMetadata();
    
    // Initialize mobile ad debugging
    initializeMobileAdDebugging();
    
    // Initialize VAST ads separately
    await initializeVastAds();
    
    // Initialize ad managers for all positions
    new AdManager('top');
    new AdManager('middle');
    new AdManager('bottom');
    new AdManager('header');
    new AdManager('sidebar');
    new AdManager('footer');
    new AdManager('interstitial');
    
    // Initialize video app functionality
    initializeStreamPage();
    
    // Initialize interstitial ad functionality
    initializeInterstitialAd();
});

// Mobile ad debugging function
function initializeMobileAdDebugging() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    
    if (isMobile) {
        // Monitor ad container visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // console.log(`📱 Ad container ${entry.target.id} is now visible`);
                }
            });
        }, { threshold: 0.1 });
        
        // Observe all ad containers
        document.querySelectorAll('.ad-content').forEach(container => {
            observer.observe(container);
        });
        
        // Monitor viewport changes
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // console.log(`📱 Viewport changed to ${window.innerWidth}x${window.innerHeight}`);
                // console.log(`📱 Device pixel ratio: ${window.devicePixelRatio}`);
            }, 250);
        });
        
        // Log initial mobile state
        // console.log(`📱 Initial viewport: ${window.innerWidth}x${window.innerHeight}`);
        // console.log(`📱 User agent: ${navigator.userAgent}`);
        // console.log(`📱 Device pixel ratio: ${window.devicePixelRatio}`);
    }
}

// Remove the entire loadAd function
// function loadAd() { ... } - REMOVED

function initializeStreamPage() {
    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', handleDownload);

    // Copy link button
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    copyLinkBtn.addEventListener('click', handleCopyLink);

    // Error page back button
    const errorBackBtn = document.getElementById('errorBackBtn');
    errorBackBtn.addEventListener('click', goToHomepage);

    // Initialize reaction system
    initializeReactions();

    // Get file ID from URL and load video
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('id');
    
    if (fileId) {
        loadVideo(fileId);
    } else {
        showErrorPage('No file ID provided in URL');
    }
}

// Go to homepage
function goToHomepage() {
    window.location.href = 'index.html';
}

// Load video with file ID
async function loadVideo(fileId) {
    try {
        // Show loading page
        Object.values(pages).forEach(page => {
            if (page) page.classList.remove('active');
        });
        pages.loadingPage.classList.add('active');
        
        // Try to get video info with fallback
        let videoInfo;
        try {
            videoInfo = await fetchFileInfo(fileId);
        } catch (error) {
            // Try fallback API endpoint
            try {
                const fallbackResponse = await fetch(`/api/file/${fileId}`);
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.success) {
                        videoInfo = fallbackData;
                        if (videoInfo.file_id) {
                            videoInfo.stream_url = `/watch/${videoInfo.file_id}`;
                            videoInfo.download_url = `/dl/${videoInfo.file_id}`;
                        }
                    } else {
                        throw new Error('Fallback API also failed');
                    }
                } else {
                    throw new Error('Fallback API also failed');
                }
            } catch (fallbackError) {
                // Both APIs failed, show error
                showErrorPage(`Video not found. The file ID "${fileId}" does not exist or is no longer available.`);
                return;
            }
        }
        
        currentVideoInfo = videoInfo;
        
        // Show stream page with video info
        await showStreamPage(videoInfo);
        
        // Track view
        await trackView(fileId);
        
    } catch (error) {
        showErrorPage(`Failed to load video: ${error.message}`);
    }
}

async function fetchFileInfo(fileId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`File not found: ${fileId}`);
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch file info');
        }
        
        // Override URLs to use our own endpoints
        if (data.file_id) {
            data.stream_url = `/watch/${data.file_id}`;
            data.download_url = `/dl/${data.file_id}`;
        }
        
        return data;
    } catch (error) {
        // Just throw the error to be handled by the caller
        throw error;
    }
}

// Show loading page
function showLoading() {
    hideAllPages();
    pages.loadingPage.classList.add('active');
}

// Show error page
function showErrorPage(message = 'An error occurred while loading the video') {
    // Hide all pages
    Object.values(pages).forEach(page => {
        if (page) page.classList.remove('active');
    });
    
    // Show error page
    pages.errorPage.classList.add('active');
    
    // Update error message
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    // Update page title
    document.title = 'Error - CamGrabber';
}

// Show stream page
async function showStreamPage(videoInfo) {
    hideAllPages();
    pages.streamPage.classList.add('active');
    
    // Update page content
    updateStreamPageContent(videoInfo);
    
    // Initialize video player with streaming URL from API response
    await initializeVideoPlayer(videoInfo.stream_url, videoInfo.title);
    
    // Track view
    if (videoInfo.file_id) {
        trackView(videoInfo.file_id);
    }
}

// Update stream page content
function updateStreamPageContent(videoInfo) {
    // Update title only
    document.getElementById('videoTitle').textContent = videoInfo.title;
    
    // Update details
    document.getElementById('detailTitle').textContent = videoInfo.title;
    document.getElementById('detailId').textContent = videoInfo.file_id;
    document.getElementById('detailDuration').textContent = formatDuration(videoInfo.duration);
    document.getElementById('detailSize').textContent = formatFileSize(videoInfo.file_size);
}

// Initialize video player with built-in VAST support
async function initializeVideoPlayer(src, title) {
    try {
        const videoElement = document.getElementById('videoPlayer');
        const sourceElement = videoElement.querySelector('source');
        
        // Set video source directly without additional parameters
        
        // Set source with streaming URL
        sourceElement.src = src;
        videoElement.load();
        
        // Test if the video source is accessible
        setTimeout(() => {
            
            // Test if the URL is accessible
            fetch(src, { method: 'HEAD' })
                .then(response => {
                    // console.log(`🎬 URL test - Status: ${response.status}`);
                    // console.log(`🎬 URL test - Content-Type: ${response.headers.get('content-type')}`);
                })
                .catch(error => {
                    // Silent error handling
                });
        }, 1000);

        // Load VAST ads using the dedicated function
        const vastAds = await initializeVastAds();

        // Initialize Fluid Player with VAST ads
        
        // Simple Fluid Player configuration
        const playerConfig = {
            layoutControls: {
                primaryColor: "#3b82f6",
                fillToContainer: true,
                posterImage: ""
            },
            responsive: true
        };
        
        // Only add VAST options if we have valid ads
        if (vastAds && vastAds.length > 0) {
            console.log(`Initializing Fluid Player with ${vastAds.length} VAST ads`);
            
            playerConfig.vastOptions = {
                adList: vastAds,
                autoplay: false,
                playAdAlways: false, // Don't force ads to play
                vpaidFlashLoaderPath: "https://www.fluidplayer.com/vast/VPAIDFlash.swf",
                timeout: 10000, // 10 second timeout for VAST ads
                maxAllowedVastTagRedirects: 5,
                vastLoadTimeout: 8000
            };
        } else {
            console.log('No valid VAST ads found, initializing player without ads');
        }
        
        // Initialize Fluid Player
        try {
            console.log('Initializing Fluid Player with config:', JSON.stringify(playerConfig, null, 2));
            videoPlayer = fluidPlayer('videoPlayer', playerConfig);
            
            // Add comprehensive error handling for VAST ads
            if (videoPlayer && videoPlayer.ads) {
                videoPlayer.ads.on('vast.adError', (error) => {
                    console.warn('VAST ad error occurred:', error);
                    // Don't break the player, just log the error
                });
                
                videoPlayer.ads.on('vast.adStarted', () => {
                    console.log('VAST ad started successfully');
                });
                
                videoPlayer.ads.on('vast.adEnded', () => {
                    console.log('VAST ad ended');
                });
                
                videoPlayer.ads.on('vast.adSkipped', () => {
                    console.log('VAST ad skipped');
                });
            }
            
            // Add general player error handling
            if (videoPlayer) {
                videoPlayer.on('error', (error) => {
                    console.warn('Fluid Player error:', error);
                });
                
                videoPlayer.on('ready', () => {
                    console.log('Fluid Player ready');
                });
            }
            
        } catch (error) {
            console.warn('Fluid Player initialization failed:', error);
            
            // If Fluid Player fails, try without VAST ads
            try {
                console.log('Attempting fallback initialization without VAST ads');
                const basicConfig = {
                    layoutControls: {
                        primaryColor: "#3b82f6",
                        fillToContainer: true,
                        posterImage: ""
                    },
                    responsive: true
                };
                videoPlayer = fluidPlayer('videoPlayer', basicConfig);
                console.log('Fallback Fluid Player initialization successful');
            } catch (fallbackError) {
                console.error('Fallback Fluid Player initialization failed:', fallbackError);
                // Continue with basic HTML5 video if Fluid Player completely fails
            }
        }
        
        // Ensure the video source is properly set after Fluid Player initialization
        setTimeout(() => {
            const videoElement = document.getElementById('videoPlayer');
            const sourceElement = videoElement.querySelector('source');
            
            if (sourceElement && sourceElement.src !== src) {
                sourceElement.src = src;
                videoElement.load();
            }
        }, 100);

        // Add a timeout to ensure video can play even if VAST ads are problematic
        setTimeout(() => {
            const videoElement = document.getElementById('videoPlayer');
            if (videoElement && videoElement.paused && videoElement.readyState >= 2) {
                console.log('Video ready but paused - attempting to enable playback');
                // Try to enable user interaction for video playback
                videoElement.style.pointerEvents = 'auto';
            }
        }, 5000); // 5 second timeout

                // Add video player event listeners
        if (videoElement) {
            videoElement.addEventListener('loadstart', () => {
                console.log('🎬 Video load started');
            });
            
            videoElement.addEventListener('loadeddata', () => {
                console.log('🎬 Video data loaded');
            });
            
            videoElement.addEventListener('canplay', () => {
                console.log('🎬 Video can play');
            });
            
            videoElement.addEventListener('error', (error) => {
                console.error('🎬 Video error:', error);
            });
            
            // Listen for play event to track when video starts
            videoElement.addEventListener('play', () => {
                console.log('🎬 Video play started');
            });
            
            // Listen for pause event
            videoElement.addEventListener('pause', () => {
                console.log('🎬 Video paused');
            });
            
            // Listen for timeupdate to track mid-roll ads
            videoElement.addEventListener('timeupdate', () => {
                const currentTime = videoElement.currentTime;
                if (currentTime > 0 && currentTime % 30 < 1) { // Check every 30 seconds
                    console.log('🎬 Video time:', currentTime, 'seconds - potential mid-roll trigger');
                }
            });
            
            // Add click handler to ensure video can be played
            videoElement.addEventListener('click', () => {
                if (videoElement.paused) {
                    console.log('🎬 Video clicked while paused - attempting to play');
                    videoElement.play().catch(error => {
                        console.warn('Failed to play video on click:', error);
                    });
                }
            });
        }
        
        // Try to access Fluid Player's internal ad events
        if (videoPlayer && videoPlayer.ads) {
            console.log('✅ Fluid Player ads module available');
        }

        // Update video title
        const titleElement = document.getElementById('videoTitle');
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        // Track view
        const urlParams = new URLSearchParams(window.location.search);
        const fileId = urlParams.get('id');
        if (fileId) {
            await trackView(fileId);
        }
        

        
    } catch (error) {
        // Silent error handling
    }
}

// Handle download
async function handleDownload() {
    if (!currentVideoInfo) {
        showDownloadError('No video loaded');
        return;
    }
    
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadText = document.getElementById('downloadText');
    const downloadSpinner = document.getElementById('downloadSpinner');
    
    try {
        // Show loading state
        downloadBtn.disabled = true;
        downloadText.textContent = 'Downloading...';
        downloadSpinner.classList.remove('hidden');
        
        // Create download link
        const downloadUrl = currentVideoInfo.download_url;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${currentVideoInfo.title}.mp4`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Track download
        trackDownload(currentVideoInfo.file_id);
        
    } catch (error) {
        // Silent error handling
    } finally {
        // Reset button state
        downloadBtn.disabled = false;
        downloadText.textContent = 'Download Video';
        downloadSpinner.classList.add('hidden');
    }
}

// Handle copy link
function handleCopyLink() {
    try {
        navigator.clipboard.writeText(window.location.href);
        
        // Show temporary success message
        const copyBtn = document.getElementById('copyLinkBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = 'rgba(34, 197, 94, 0.8)';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        // Silent error handling
    }
}

// Show download error
function showDownloadError(message) {
    const downloadError = document.getElementById('downloadError');
    downloadError.textContent = message;
    downloadError.classList.remove('hidden');
    
    setTimeout(() => {
        downloadError.classList.add('hidden');
    }, 5000);
}

// Hide all pages
function hideAllPages() {
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
    });
}

// Format duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Format file size
function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}



// Reaction system
let reactions = {
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0
};

let reactionSettings = {
    like: { emoji: '👍', label: 'Like' },
    love: { emoji: '❤️', label: 'Love' },
    haha: { emoji: '😄', label: 'Haha' },
    wow: { emoji: '😮', label: 'Wow' },
    sad: { emoji: '😢', label: 'Sad' },
    angry: { emoji: '😠', label: 'Angry' }
};

let userReaction = null;

// Load reaction settings from database
async function loadReactionSettings() {
    try {
        const response = await fetch('/api/settings/reactions');
        if (response.ok) {
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
                reactionSettings = data;
                updateReactionButtons();
            }
        }
    } catch (error) {
        // Silent error handling
    }
}

function updateReactionButtons() {
    const reactionContainer = document.querySelector('.reactions-container');
    if (!reactionContainer) return;
    
    // Clear existing buttons
    reactionContainer.innerHTML = '';
    
    // Create new buttons based on loaded settings
    Object.keys(reactionSettings).forEach(reactionKey => {
        const reaction = reactionSettings[reactionKey];
        const buttonHtml = `
            <button class="reaction-btn" data-reaction="${reactionKey}" title="${reaction.label}">
                <span class="reaction-emoji">${reaction.emoji}</span>
                <span class="reaction-label">${reaction.label}</span>
                <span class="reaction-count" id="${reactionKey}Count">0</span>
            </button>
        `;
        reactionContainer.innerHTML += buttonHtml;
    });
    
    // Re-add event listeners
    const reactionButtons = document.querySelectorAll('.reaction-btn');
    reactionButtons.forEach(button => {
        button.addEventListener('click', handleReactionClick);
    });
}

function initializeReactions() {
    // Load saved reactions from localStorage
    const savedReactions = localStorage.getItem('videoReactions');
    if (savedReactions) {
        reactions = JSON.parse(savedReactions);
        updateReactionCounts();
    }

    // Load reaction settings and update buttons
    loadReactionSettings().then(() => {
        // Add click event listeners to all reaction buttons
        const reactionButtons = document.querySelectorAll('.reaction-btn');
        reactionButtons.forEach(button => {
            button.addEventListener('click', handleReactionClick);
        });
    });
}

function handleReactionClick(event) {
    const button = event.currentTarget;
    const reactionType = button.dataset.reaction;
    
    // Add click animation
    button.classList.add('clicked');
    setTimeout(() => {
        button.classList.remove('clicked');
    }, 300);

    // Handle reaction logic
    if (userReaction === reactionType) {
        // Remove reaction
        reactions[reactionType]--;
        userReaction = null;
        button.classList.remove('active');
    } else {
        // Add new reaction (remove previous if exists)
        if (userReaction && userReaction !== reactionType) {
            reactions[userReaction]--;
            document.querySelector(`[data-reaction="${userReaction}"]`).classList.remove('active');
        }
        
        reactions[reactionType]++;
        userReaction = reactionType;
        button.classList.add('active');
    }

    // Update UI
    updateReactionCounts();
    
    // Save to localStorage
    localStorage.setItem('videoReactions', JSON.stringify(reactions));
    
    // Track reaction
    if (currentVideoInfo && currentVideoInfo.file_id) {
        trackReaction(currentVideoInfo.file_id);
    }
}

function updateReactionCounts() {
    // Update individual reaction counts
    Object.keys(reactions).forEach(reaction => {
        const countElement = document.getElementById(`${reaction}Count`);
        if (countElement) {
            countElement.textContent = reactions[reaction];
        }
    });

    // Update total reactions
    const total = Object.values(reactions).reduce((sum, count) => sum + count, 0);
    const totalElement = document.getElementById('totalReactions');
    if (totalElement) {
        totalElement.textContent = `${total} reaction${total !== 1 ? 's' : ''}`;
    }
}

// Interstitial Ad Functions
function initializeInterstitialAd() {
    // First check if we have any interstitial ads in adsData
    if (!adsData.interstitial || adsData.interstitial.length === 0) {
        return;
    }
    
    // Check if the interstitial ad code is actually empty or contains placeholder text
    const interstitialAd = adsData.interstitial[0];
    if (!interstitialAd || 
        !interstitialAd.adCode || 
        interstitialAd.adCode.trim() === '' || 
        interstitialAd.adCode.includes('interstitial-ad-script')) {
        return;
    }
    
    // Wait for AdManager to finish loading interstitial ad
    setTimeout(() => {
        // Check if interstitial ad has actual content (not just fallback text)
        const interstitialAdContent = document.getElementById('interstitial-ad-content');
        const interstitialAdFallback = document.getElementById('interstitial-ad-fallback');
        
        // Only show interstitial if:
        // 1. Ad content container exists and has children
        // 2. Fallback is hidden (meaning ad loaded successfully)
        // 3. Ad content is not empty
        if (interstitialAdContent && 
            interstitialAdContent.children.length > 0 && 
            interstitialAdFallback && 
            interstitialAdFallback.style.display === 'none' &&
            interstitialAdContent.innerHTML.trim() !== '') {
            
            // Additional check: make sure we have actual ad content, not just empty divs
            let hasRealContent = false;
            for (let child of interstitialAdContent.children) {
                if (child.innerHTML.trim() !== '' && 
                    !child.innerHTML.includes('External ad content loading')) {
                    hasRealContent = true;
                    break;
                }
            }
            
            if (hasRealContent) {
                // Show interstitial ad after 3 seconds
                setTimeout(() => {
                    showInterstitialAd();
                }, 3000);
            }
        }
    }, 2000); // Wait 2 seconds for AdManager to load and process
}

function showInterstitialAd() {
    const interstitialOverlay = document.getElementById('interstitialAdOverlay');
    const closeBtn = document.getElementById('closeInterstitialBtn');
    
    if (interstitialOverlay) {
        interstitialOverlay.classList.remove('hidden');
        interstitialOverlay.style.display = 'flex';
        
        // Add close button functionality
        if (closeBtn) {
            closeBtn.addEventListener('click', hideInterstitialAd);
        }
        
        // Prevent body scroll when interstitial is open
        document.body.style.overflow = 'hidden';
    }
}

function hideInterstitialAd() {
    const interstitialOverlay = document.getElementById('interstitialAdOverlay');
    
    if (interstitialOverlay) {
        interstitialOverlay.classList.add('hidden');
        interstitialOverlay.style.display = 'none';
        
        // Restore body scroll
        document.body.style.overflow = 'auto';
    }
}

// Test VAST URL accessibility
async function testVastUrl(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'cors',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            return {
                valid: true,
                status: response.status,
                contentType: contentType
            };
        } else {
            return {
                valid: false,
                status: response.status,
                error: `HTTP ${response.status}`
            };
        }
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

// Initialize VAST ads separately from banner ads
async function initializeVastAds() {
    try {
        // Load VAST ads from database
        const vastResponse = await fetch('/api/settings/vast_ads');
        let vastAds = [];
        
        if (vastResponse.ok) {
            const vastData = await vastResponse.json();
            
            // Convert database format to Fluid Player format
            if (vastData.preRoll && vastData.preRoll.trim() !== '') {
                vastAds.push({
                    roll: "preRoll",
                    vastTag: vastData.preRoll
                });
            }
            
            if (vastData.midRoll && vastData.midRoll.trim() !== '') {
                vastAds.push({
                    roll: "midRoll",
                    vastTag: vastData.midRoll,
                    timer: 30 // Show mid-roll ad after 30 seconds
                });
            }
            
            if (vastData.postRoll && vastData.postRoll.trim() !== '') {
                vastAds.push({
                    roll: "postRoll",
                    vastTag: vastData.postRoll
                });
            }
            
            // If no ads from database, try the old format
            if (vastAds.length === 0 && vastData.vastAds && Array.isArray(vastData.vastAds)) {
                vastData.vastAds.forEach(ad => {
                    if (ad && typeof ad === 'string' && ad.trim() !== '') {
                        vastAds.push({
                            roll: "preRoll",
                            vastTag: ad
                        });
                    }
                });
            }
        }
        
        // Validate VAST URLs before returning them
        const validatedAds = [];
        for (const ad of vastAds) {
            console.log(`Testing VAST URL: ${ad.vastTag}`);
            const testResult = await testVastUrl(ad.vastTag);
            
            if (testResult.valid) {
                console.log(`✅ VAST URL valid: ${ad.vastTag} - Status: ${testResult.status}`);
                validatedAds.push(ad);
            } else {
                console.warn(`❌ VAST URL failed validation: ${ad.vastTag} - ${testResult.error}`);
            }
        }
        
        // If no valid ads found, return empty array to skip VAST ads entirely
        if (validatedAds.length === 0) {
            console.log('No valid VAST ads found, proceeding without ads');
            return [];
        }
        
        return validatedAds;
        
    } catch (error) {
        console.warn('VAST ads initialization error:', error);
        // Return empty array to skip VAST ads on error
        return [];
    }
}

 