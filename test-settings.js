const fetch = require('node-fetch');

async function testSettings() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🧪 Testing Settings API Endpoints...\n');
    
    try {
        // Test page titles
        console.log('📄 Testing Page Titles...');
        const pageTitlesResponse = await fetch(`${baseUrl}/api/settings/page_titles`);
        const pageTitles = await pageTitlesResponse.json();
        console.log('Page Titles Response:', JSON.stringify(pageTitles, null, 2));
        
        // Test metadata
        console.log('\n📋 Testing Metadata...');
        const metadataResponse = await fetch(`${baseUrl}/api/settings/metadata`);
        const metadata = await metadataResponse.json();
        console.log('Metadata Response:', JSON.stringify(metadata, null, 2));
        
        // Test reactions
        console.log('\n😀 Testing Reactions...');
        const reactionsResponse = await fetch(`${baseUrl}/api/settings/reactions`);
        const reactions = await reactionsResponse.json();
        console.log('Reactions Response:', JSON.stringify(reactions, null, 2));
        
        // Test banner ads
        console.log('\n📢 Testing Banner Ads...');
        const bannerAdsResponse = await fetch(`${baseUrl}/api/settings/banner_ads`);
        const bannerAds = await bannerAdsResponse.json();
        console.log('Banner Ads Response:', JSON.stringify(bannerAds, null, 2));
        
        // Test API settings
        console.log('\n🔧 Testing API Settings...');
        const apiSettingsResponse = await fetch(`${baseUrl}/api/settings/api`);
        const apiSettings = await apiSettingsResponse.json();
        console.log('API Settings Response:', JSON.stringify(apiSettings, null, 2));
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Error testing settings:', error);
    }
}

// Wait a bit for server to start
setTimeout(testSettings, 2000); 