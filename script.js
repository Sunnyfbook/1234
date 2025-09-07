// API Configuration
let API_BASE_URL = 'https://camgrabber-mb2q.onrender.com'; // Default fallback

// Load API settings from database
async function loadApiSettings() {
    try {
        const response = await fetch('/api/settings/api');
        if (response.ok) {
            const settings = await response.json();
            API_BASE_URL = settings.apiBaseUrl || 'https://camgrabber-mb2q.onrender.com';
            console.log('API Base URL loaded:', API_BASE_URL);
        }
    } catch (error) {
        console.error('Failed to load API settings:', error);
        // Keep default URL if loading fails
    }
}

// Load page titles from database
async function loadPageTitles() {
    try {
        const response = await fetch('/api/settings/page_titles');
        if (response.ok) {
            const data = await response.json();
            console.log('📄 Page titles data received:', data);
            
            // Update page title
            if (data.homepage?.title) {
                document.title = data.homepage.title;
                console.log('✅ Page title updated to:', data.homepage.title);
            }
            
            // Update homepage header
            const headerTitle = document.querySelector('#homepage h1');
            const headerSubtitle = document.querySelector('#homepage p');
            
            if (headerTitle && data.homepage?.title) {
                headerTitle.textContent = data.homepage.title;
                console.log('✅ Homepage title updated to:', data.homepage.title);
            }
            if (headerSubtitle && data.homepage?.subtitle) {
                headerSubtitle.textContent = data.homepage.subtitle;
                console.log('✅ Homepage subtitle updated to:', data.homepage.subtitle);
            }
            
            console.log('✅ Page titles loaded from database');
        }
    } catch (error) {
        console.error('Failed to load page titles:', error);
        console.log('Using default page titles');
    }
}

// Load metadata from database
async function loadMetadata() {
    try {
        const response = await fetch('/api/settings/metadata');
        if (response.ok) {
            const data = await response.json();
            console.log('📋 Metadata data received:', data);
            
            // Update meta tags
            const metaDescription = document.querySelector('meta[name="description"]');
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            const metaAuthor = document.querySelector('meta[name="author"]');
            
            if (metaDescription && data.websiteDescription) {
                metaDescription.setAttribute('content', data.websiteDescription);
                console.log('✅ Meta description updated to:', data.websiteDescription);
            }
            if (metaKeywords && data.websiteKeywords) {
                metaKeywords.setAttribute('content', data.websiteKeywords);
                console.log('✅ Meta keywords updated to:', data.websiteKeywords);
            }
            if (metaAuthor && data.websiteAuthor) {
                metaAuthor.setAttribute('content', data.websiteAuthor);
                console.log('✅ Meta author updated to:', data.websiteAuthor);
            }
            
            // Update Open Graph tags
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const ogDescription = document.querySelector('meta[property="og:description"]');
            const ogImage = document.querySelector('meta[property="og:image"]');
            
            if (ogTitle && (data.ogTitle || data.websiteTitle)) {
                ogTitle.setAttribute('content', data.ogTitle || data.websiteTitle);
                console.log('✅ OG title updated to:', data.ogTitle || data.websiteTitle);
            }
            if (ogDescription && (data.ogDescription || data.websiteDescription)) {
                ogDescription.setAttribute('content', data.ogDescription || data.websiteDescription);
                console.log('✅ OG description updated to:', data.ogDescription || data.websiteDescription);
            }
            if (ogImage && data.ogImage) {
                ogImage.setAttribute('content', data.ogImage);
                console.log('✅ OG image updated to:', data.ogImage);
            }
            
            // Add favicon if specified
            if (data.faviconUrl) {
                const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
                favicon.rel = 'icon';
                favicon.href = data.faviconUrl;
                if (!document.querySelector('link[rel="icon"]')) {
                    document.head.appendChild(favicon);
                }
                console.log('✅ Favicon updated to:', data.faviconUrl);
            }
            
            console.log('✅ Metadata loaded from database');
        }
    } catch (error) {
        console.error('Failed to load metadata:', error);
        console.log('Using default metadata');
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
            
            console.log('✅ Banner ads loaded from database');
            
            // Log which ads have content
            const adPositions = ['top', 'middle', 'bottom', 'header', 'sidebar', 'footer', 'interstitial'];
            adPositions.forEach(position => {
                const hasAdCode = data[position] && data[position].trim() !== '';
                console.log(`${position} ad: ${hasAdCode ? '✅ Configured' : '❌ Empty/Not configured'}`);
            });
        }
    } catch (error) {
        console.error('Failed to load banner ads:', error);
        console.log('Using fallback ad codes');
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
        console.log('View tracked for file:', fileId);
    } catch (error) {
        console.error('Failed to track view:', error);
    }
}

async function trackDownload(fileId) {
    try {
        await fetch('/api/admin/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'download', fileId })
        });
        console.log('Download tracked for file:', fileId);
    } catch (error) {
        console.error('Failed to track download:', error);
    }
}

// Global variables
let currentVideoInfo = null;
let videoPlayer = null;

// DOM elements
const pages = {
    homepage: document.getElementById('homepage'),
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
            console.log(`✅ Initializing AdManager for ${position} - ads configured`);
            this.init();
        } else {
            console.log(`❌ Skipping AdManager for ${position} - no valid ads configured`);
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
            console.error(`❌ Ad script failed to load for ${this.position}`);
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
                                console.log(`⚠️ Detected URL-only content for ${this.position} ad, skipping`);
                                continue; // Skip this element
                            }
                            
                            // Additional mobile-specific content validation
                            if (this.isMobile && this.isInvalidAdContent(elementToMove)) {
                                console.log(`⚠️ Detected invalid ad content for mobile, skipping`);
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
                console.error('Error moving ad content:', error);
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
                    console.log(`Retrying ad load for ${this.position}, attempt ${this.adLoadRetries}`);
                    this.adLoadTimeout = setTimeout(moveContent, timeout * 2);
                    this.adLoadTimeout = setTimeout(checkAdLoad, timeout * 3);
                } else {
                    console.log(`❌ ${this.position} ad failed to load after ${this.maxRetries} attempts`);
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
                    console.log(`✅ ${this.position} ad loaded successfully`);
                    // Hide fallback if it was showing
                    if (this.fallback) {
                        this.fallback.style.display = 'none';
                    }
                } else {
                    // Only show fallback if we have no valid content and no retries left
                    if (this.adLoadRetries >= this.maxRetries) {
                        console.log(`⚠️ ${this.position} ad has invalid content, showing fallback`);
                        this.showFallback();
                    } else {
                        // Try again
                        this.adLoadRetries++;
                        console.log(`Retrying ${this.position} ad validation, attempt ${this.adLoadRetries}`);
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
                console.log(`⚠️ Removing URL-only content: ${childText.substring(0, 50)}...`);
                child.remove();
                continue;
            }
            
            // Skip if it's clearly invalid content
            if (this.isInvalidAdContent(child)) {
                console.log(`⚠️ Removing invalid ad content: ${childText.substring(0, 50)}...`);
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
    await loadPageTitles(); // Load page titles
    await loadMetadata(); // Load metadata
    
    // Initialize mobile ad debugging
    initializeMobileAdDebugging();
    
    // Initialize ad managers for all positions
    new AdManager('top');
    new AdManager('middle');
    new AdManager('bottom');
    new AdManager('header');
    new AdManager('sidebar');
    new AdManager('footer');
    new AdManager('interstitial');
    
    // Initialize video app functionality
    initializeApp();
    
    // Initialize interstitial ad functionality
    initializeInterstitialAd();
});

// Mobile ad debugging function
function initializeMobileAdDebugging() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    
    if (isMobile) {
        console.log('📱 Mobile device detected - initializing mobile ad debugging');
        
        // Monitor ad container visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log(`📱 Ad container ${entry.target.id} is now visible`);
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
                console.log(`📱 Viewport changed to ${window.innerWidth}x${window.innerHeight}`);
                console.log(`📱 Device pixel ratio: ${window.devicePixelRatio}`);
            }, 250);
        });
        
        // Log initial mobile state
        console.log(`📱 Initial viewport: ${window.innerWidth}x${window.innerHeight}`);
        console.log(`📱 User agent: ${navigator.userAgent}`);
        console.log(`📱 Device pixel ratio: ${window.devicePixelRatio}`);
    }
}

// Simple initialization like working version
async function initializeApp() {
    // Load API settings first
    await loadApiSettings();
    
    // Set up YouTube form submission
    const youtubeForm = document.getElementById('youtubeForm');
    if (youtubeForm) {
        youtubeForm.addEventListener('submit', handleYouTubeSubmit);
    }
}

// Handle YouTube form submission
async function handleYouTubeSubmit(e) {
    e.preventDefault();
    
    const url = document.getElementById('youtubeUrl').value.trim();
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeBtnText = document.getElementById('analyzeBtnText');
    const analyzeBtnLoading = document.getElementById('analyzeBtnLoading');
    const videoInfo = document.getElementById('videoInfo');
    const errorMessage = document.getElementById('errorMessage');
    
    // Hide previous results
    videoInfo.classList.add('hidden');
    errorMessage.classList.add('hidden');
    
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtnText.classList.add('hidden');
    analyzeBtnLoading.classList.remove('hidden');
    
    try {
        // Extract video ID from YouTube URL
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL. Please enter a valid YouTube video URL.');
        }
        
        // Analyze video (simulate API call)
        const videoData = await analyzeYouTubeVideo(videoId);
        
        // Display video information
        displayVideoInfo(videoData);
        
    } catch (error) {
        showError(error.message);
    } finally {
        // Reset button state
        analyzeBtn.disabled = false;
        analyzeBtnText.classList.remove('hidden');
        analyzeBtnLoading.classList.add('hidden');
    }
}

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

// Analyze YouTube video (simulate API call)
async function analyzeYouTubeVideo(videoId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock video data (in real app, this would come from a YouTube API)
    const mockVideoData = {
        id: videoId,
        title: `Sample YouTube Video ${videoId.substring(0, 8)}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: '3:45',
        channel: 'Sample Channel',
        formats: [
            {
                quality: '1080p',
                format: 'MP4',
                size: '45.2 MB',
                url: `https://example.com/download/${videoId}/1080p`
            },
            {
                quality: '720p',
                format: 'MP4',
                size: '28.7 MB',
                url: `https://example.com/download/${videoId}/720p`
            },
            {
                quality: '480p',
                format: 'MP4',
                size: '18.3 MB',
                url: `https://example.com/download/${videoId}/480p`
            },
            {
                quality: '360p',
                format: 'MP4',
                size: '12.1 MB',
                url: `https://example.com/download/${videoId}/360p`
            },
            {
                quality: 'Audio Only',
                format: 'MP3',
                size: '5.2 MB',
                url: `https://example.com/download/${videoId}/audio`
            }
        ]
    };
    
    return mockVideoData;
}

// Display video information
function displayVideoInfo(videoData) {
    const videoInfo = document.getElementById('videoInfo');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoDuration = document.getElementById('videoDuration');
    const videoChannel = document.getElementById('videoChannel');
    const downloadOptions = document.getElementById('downloadOptions');
    
    // Set video details
    videoThumbnail.src = videoData.thumbnail;
    videoTitle.textContent = videoData.title;
    videoDuration.textContent = `Duration: ${videoData.duration}`;
    videoChannel.textContent = `Channel: ${videoData.channel}`;
    
    // Generate download options
    downloadOptions.innerHTML = '';
    videoData.formats.forEach(format => {
        const optionElement = document.createElement('div');
        optionElement.className = 'download-option';
        optionElement.innerHTML = `
            <div class="download-info">
                <div class="download-quality">${format.quality}</div>
                <div class="download-format">${format.format}</div>
                <div class="download-size">${format.size}</div>
            </div>
            <button class="download-btn" onclick="downloadVideo('${format.url}', '${videoData.title} - ${format.quality}.${format.format.toLowerCase()}')">
                📥 Download
            </button>
        `;
        downloadOptions.appendChild(optionElement);
    });
    
    // Show video info
    videoInfo.classList.remove('hidden');
}

// Download video function
function downloadVideo(url, filename) {
    // In a real app, this would trigger the actual download
    // For now, we'll simulate the download process
    
    const downloadBtn = event.target;
    const originalText = downloadBtn.textContent;
    
    downloadBtn.textContent = '⏳ Downloading...';
    downloadBtn.disabled = true;
    
    // Simulate download process
    setTimeout(() => {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Reset button
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
        
        // Show success message
        showSuccess('Download started! Check your downloads folder.');
    }, 2000);
}

// Show success message
function showSuccess(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add slideIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Function to directly access a specific video
function accessVideo(fileId) {
    if (!fileId) {
        console.error('No file ID provided');
        return;
    }
    
    // Update URL
    const newUrl = `${window.location.origin}${window.location.pathname}?id=${fileId}`;
    window.history.pushState({}, '', newUrl);
    
    // Load the video
    loadVideo(fileId);
}

// Extract file ID from URL
function extractFileIdFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const fileId = urlObj.searchParams.get('id');
        return fileId;
    } catch (error) {
        console.error('Error extracting file ID from URL:', error);
        return null;
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const urlInput = document.getElementById('videoUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Please enter a video URL');
        return;
    }

    // Extract file ID
    let fileId = null;
    
    // Check if URL contains query parameters
    if (url.includes('?')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        fileId = urlParams.get('id');
    }
    
    // If no file ID found, try to extract from URL
    if (!fileId) {
        fileId = extractFileIdFromUrl(url);
    }
    
    if (!fileId) {
        showError('Invalid URL format. Please provide a valid video URL.');
        return;
    }

    // Load the video
    await loadVideo(fileId);
}

// Handle example button click
function handleExampleClick() {
    const urlInput = document.getElementById('videoUrl');
    urlInput.value = 'https://camgrabber.onrender.com/stream?id=AgADLh_1218';
}

// Load video with file ID
async function loadVideo(fileId) {
    try {
        showLoading();
        
        // Get video info from API
        const videoInfo = await getFileInfo(fileId);
        currentVideoInfo = videoInfo;
        
        // Update URL
        const newUrl = `${window.location.origin}${window.location.pathname}?id=${fileId}`;
        window.history.pushState({}, '', newUrl);
        
        // Show stream page
        showStreamPage(videoInfo);
        
    } catch (error) {
        console.error('Error loading video:', error);
        showErrorPage(error.message || 'Failed to load video');
    }
}

// Get video info from API
async function getFileInfo(fileId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/file/${fileId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching file info:', error);
        throw new Error(`Failed to fetch video info for file ID: ${fileId}`);
    }
}

// Show loading page
function showLoading() {
    hideAllPages();
    pages.loadingPage.classList.add('active');
}

// Show error page
function showErrorPage(message) {
    hideAllPages();
    document.getElementById('errorMessage').textContent = message;
    pages.errorPage.classList.add('active');
}

// Show homepage
function showHomepage() {
    hideAllPages();
    pages.homepage.classList.add('active');
    
    // Clear form
    document.getElementById('videoUrl').value = '';
    document.getElementById('error').classList.add('hidden');
    
    // Update URL
    window.history.pushState({}, '', window.location.pathname);
}

// Show stream page
function showStreamPage(videoInfo) {
    hideAllPages();
    pages.streamPage.classList.add('active');
    
    // Update page content
    updateStreamPageContent(videoInfo);
    
    // Initialize video player
    initializeVideoPlayer(videoInfo.stream_url, videoInfo.title);
    
    // Track view
    if (videoInfo.file_id) {
        trackView(videoInfo.file_id);
    }
}

// Update stream page content
function updateStreamPageContent(videoInfo) {
    // Update title and info
    document.getElementById('videoTitle').textContent = videoInfo.title;
    document.getElementById('videoDuration').textContent = `Duration: ${formatDuration(videoInfo.duration)}`;
    document.getElementById('videoSize').textContent = `Size: ${formatFileSize(videoInfo.file_size)}`;
    document.getElementById('videoId').textContent = `File ID: ${videoInfo.file_id}`;
    
    // Update details
    document.getElementById('detailTitle').textContent = videoInfo.title;
    document.getElementById('detailId').textContent = videoInfo.file_id;
    document.getElementById('detailDuration').textContent = formatDuration(videoInfo.duration);
    document.getElementById('detailSize').textContent = formatFileSize(videoInfo.file_size);
    document.getElementById('detailUrl').textContent = videoInfo.stream_url;
}

// Initialize video player
function initializeVideoPlayer(src, title) {
    const videoElement = document.getElementById('videoPlayer');
    
    // Dispose existing player if any
    if (videoPlayer) {
        try {
            videoPlayer.dispose();
        } catch (error) {
            console.warn('Error disposing video player:', error);
        }
    }
    
    // Initialize new player
    videoPlayer = window.videojs(videoElement, {
        controls: true,
        fluid: true,
        responsive: true,
        preload: 'metadata',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        inactivityTimeout: 3000,
        userActions: { hotkeys: true },
        errorDisplay: true,
        html5: {
            hls: {
                overrideNative: true
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false
        }
    });
    
    // Set video source
    videoPlayer.src({
        src: src,
        type: 'video/mp4'
    });
    
    // Error handling
    videoPlayer.on('error', () => {
        console.error('Video player error:', videoPlayer.error());
    });
    
    // Ready event
    videoPlayer.ready(() => {
        console.log('Video player ready');
    });
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
        console.error('Download error:', error);
        showDownloadError('Download failed');
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
        console.error('Copy error:', error);
        showDownloadError('Failed to copy link');
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

// Show error message on homepage
function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
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

// Handle browser back/forward
window.addEventListener('popstate', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('id');
    
    if (fileId) {
        loadVideo(fileId);
    } else {
        showHomepage();
    }
});

// Make accessVideo function globally available
window.accessVideo = accessVideo;

// Interstitial Ad Functions
function initializeInterstitialAd() {
    // First check if we have any interstitial ads in adsData
    if (!adsData.interstitial || adsData.interstitial.length === 0) {
        console.log('No interstitial ads configured, skipping interstitial initialization');
        return;
    }
    
    // Check if the interstitial ad code is actually empty or contains placeholder text
    const interstitialAd = adsData.interstitial[0];
    if (!interstitialAd || 
        !interstitialAd.adCode || 
        interstitialAd.adCode.trim() === '' || 
        interstitialAd.adCode.includes('interstitial-ad-script')) {
        console.log('Interstitial ad code is empty or placeholder, skipping interstitial initialization');
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
                console.log('✅ Interstitial ad loaded successfully, will show after 3 seconds');
                // Show interstitial ad after 3 seconds
                setTimeout(() => {
                    showInterstitialAd();
                }, 3000);
            } else {
                console.log('❌ Interstitial ad has no real content, not showing');
            }
        } else {
            console.log('❌ Interstitial ad not loaded properly, not showing');
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
