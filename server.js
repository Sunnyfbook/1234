const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
    origin: ['https://mmsbee.ilja.org', 'http://localhost:3000', 'https://camgrabber-mb2q.onrender.com'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://sunnyfbook21:pY62CnoJaudg1wXt@cluster0.brruqsz.mongodb.net/?retryWrites=true&w=majority";
const DATABASE_NAME = process.env.DATABASE_NAME || "cluster0";

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: DATABASE_NAME
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// MongoDB Schemas
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
});

const statsSchema = new mongoose.Schema({
    totalViews: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    totalReactions: { type: Number, default: 0 },
    activeAds: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

const activitySchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);
const Settings = mongoose.model('Settings', settingsSchema);
const Stats = mongoose.model('Stats', statsSchema);
const Activity = mongoose.model('Activity', activitySchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to update active ads count
async function updateActiveAdsCount() {
    try {
        let activeAdsCount = 0;
        
        // Check banner ads
        const bannerAds = await Settings.findOne({ key: 'banner_ads' });
        if (bannerAds && bannerAds.value) {
            if (bannerAds.value.top && bannerAds.value.top.trim()) activeAdsCount++;
            if (bannerAds.value.middle && bannerAds.value.middle.trim()) activeAdsCount++;
            if (bannerAds.value.bottom && bannerAds.value.bottom.trim()) activeAdsCount++;
            if (bannerAds.value.header && bannerAds.value.header.trim()) activeAdsCount++;
            if (bannerAds.value.sidebar && bannerAds.value.sidebar.trim()) activeAdsCount++;
            if (bannerAds.value.footer && bannerAds.value.footer.trim()) activeAdsCount++;
        }
        
        // Check VAST ads
        const vastAds = await Settings.findOne({ key: 'vast_ads' });
        if (vastAds && vastAds.value) {
            if (vastAds.value.preRoll && vastAds.value.preRoll.trim()) activeAdsCount++;
            if (vastAds.value.midRoll && vastAds.value.midRoll.trim()) activeAdsCount++;
            if (vastAds.value.postRoll && vastAds.value.postRoll.trim()) activeAdsCount++;
        }
        
        // Update stats
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats();
        }
        stats.activeAds = activeAdsCount;
        await stats.save();
        
        console.log('Active ads count updated:', activeAdsCount);
    } catch (error) {
        console.error('Error updating active ads count:', error);
    }
}

// Generate MongoDB connection string
function generateConnectionString(host, port, username, password, database) {
    if (username && password) {
        return `mongodb://${username}:${password}@${host}:${port}/${database}?retryWrites=true&w=majority`;
    } else {
        return `mongodb://${host}:${port}/${database}?retryWrites=true&w=majority`;
    }
}

// Generate MongoDB Atlas connection string
function generateAtlasConnectionString(username, password, cluster, database) {
    return `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/?retryWrites=true&w=majority`;
}

// Database migration function
async function migrateDatabase(newConnectionString, newDatabaseName) {
    try {
        console.log('🔄 Starting database migration...');
        console.log('New connection string:', newConnectionString);
        console.log('New database name:', newDatabaseName);
        
        // Store current data before migration
        const currentData = {
            settings: await Settings.find({}),
            stats: await Stats.find({}),
            activities: await Activity.find({}),
            admin: await Admin.find({})
        };
        
        console.log('📊 Current data backup:');
        console.log(`  Settings: ${currentData.settings.length} records`);
        console.log(`  Stats: ${currentData.stats.length} records`);
        console.log(`  Activities: ${currentData.activities.length} records`);
        console.log(`  Admin: ${currentData.admin.length} records`);
        
        // Close current connection
        await mongoose.connection.close();
        console.log('✅ Current connection closed');
        
        // Connect to new database
        await mongoose.connect(newConnectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: newDatabaseName
        });
        console.log('✅ Connected to new database');
        
        // Recreate collections and migrate data
        const newSettings = mongoose.model('Settings', settingsSchema);
        const newStats = mongoose.model('Stats', statsSchema);
        const newActivity = mongoose.model('Activity', activitySchema);
        const newAdmin = mongoose.model('Admin', adminSchema);
        
        // Migrate settings
        if (currentData.settings.length > 0) {
            await newSettings.insertMany(currentData.settings);
            console.log('✅ Settings migrated');
        }
        
        // Migrate stats
        if (currentData.stats.length > 0) {
            await newStats.insertMany(currentData.stats);
            console.log('✅ Stats migrated');
        }
        
        // Migrate activities
        if (currentData.activities.length > 0) {
            await newActivity.insertMany(currentData.activities);
            console.log('✅ Activities migrated');
        }
        
        // Migrate admin
        if (currentData.admin.length > 0) {
            await newAdmin.insertMany(currentData.admin);
            console.log('✅ Admin migrated');
        }
        
        // Update global models
        global.Settings = newSettings;
        global.Stats = newStats;
        global.Activity = newActivity;
        global.Admin = newAdmin;
        
        console.log('🎉 Database migration completed successfully!');
        return { success: true, message: 'Database migrated successfully' };
        
    } catch (error) {
        console.error('❌ Database migration failed:', error);
        
        // Try to reconnect to original database
        try {
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                dbName: DATABASE_NAME
            });
            console.log('✅ Reconnected to original database');
        } catch (reconnectError) {
            console.error('❌ Failed to reconnect to original database:', reconnectError);
        }
        
        return { success: false, message: 'Database migration failed: ' + error.message };
    }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// WebSocket connection handling
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    clients.add(ws);

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                case 'settings_update':
                    // Broadcast settings update to all clients
                    broadcastToClients({
                        type: 'settings_update',
                        section: data.section,
                        timestamp: new Date()
                    });
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(ws);
    });
});

function broadcastToClients(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes (must come before other routes)
app.get('/api/admin/test', async (req, res) => {
    try {
        const admin = await Admin.findOne({ username: 'admin' });
        res.json({ 
            adminExists: !!admin,
            message: admin ? 'Admin exists' : 'No admin found'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
    try {
        console.log('Login route hit');
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        
        const { username, password } = req.body;
        
        console.log('Login attempt:', { username, password: password ? 'provided' : 'missing' });
        
        // Check if admin exists, if not create default admin
        let admin = await Admin.findOne({ username });
        if (!admin) {
            console.log('Creating default admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            admin = new Admin({
                username: 'admin',
                password: hashedPassword,
                email: 'admin@example.com'
            });
            await admin.save();
            console.log('Default admin created successfully');
        }
        
        const validPassword = await bcrypt.compare(password, admin.password);
        console.log('Password validation:', validPassword ? 'success' : 'failed');
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
        console.log('Token generated for user:', admin.username);
        res.json({ token, user: { username: admin.username, email: admin.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Stats
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats();
            await stats.save();
        }
        
        // Calculate active ads based on actual settings
        let activeAdsCount = 0;
        
        // Check banner ads
        const bannerAds = await Settings.findOne({ key: 'banner_ads' });
        if (bannerAds && bannerAds.value) {
            if (bannerAds.value.top && bannerAds.value.top.trim()) activeAdsCount++;
            if (bannerAds.value.middle && bannerAds.value.middle.trim()) activeAdsCount++;
            if (bannerAds.value.bottom && bannerAds.value.bottom.trim()) activeAdsCount++;
            if (bannerAds.value.header && bannerAds.value.header.trim()) activeAdsCount++;
            if (bannerAds.value.sidebar && bannerAds.value.sidebar.trim()) activeAdsCount++;
            if (bannerAds.value.footer && bannerAds.value.footer.trim()) activeAdsCount++;
        }
        
        // Check VAST ads
        const vastAds = await Settings.findOne({ key: 'vast_ads' });
        if (vastAds && vastAds.value) {
            if (vastAds.value.preRoll && vastAds.value.preRoll.trim()) activeAdsCount++;
            if (vastAds.value.midRoll && vastAds.value.midRoll.trim()) activeAdsCount++;
            if (vastAds.value.postRoll && vastAds.value.postRoll.trim()) activeAdsCount++;
        }
        
        // Update stats with calculated active ads
        stats.activeAds = activeAdsCount;
        await stats.save();
        
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/stats', async (req, res) => {
    try {
        const { action, fileId, title } = req.body;
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats();
        }
        
        if (action === 'view') {
            stats.totalViews++;
        } else if (action === 'download') {
            stats.totalDownloads++;
        } else if (action === 'reaction') {
            stats.totalReactions++;
        }
        
        await stats.save();
        res.json({ message: 'Stats updated' });
    } catch (error) {
        console.error('Update stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Banner Ads Management
app.get('/api/settings/banner_ads', async (req, res) => {
    try {
        const bannerAds = await Settings.findOne({ key: 'banner_ads' });
        res.json(bannerAds ? bannerAds.value : {});
    } catch (error) {
        console.error('Banner ads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/ads/banner', authenticateToken, async (req, res) => {
    try {
        await Settings.findOneAndUpdate(
            { key: 'banner_ads' },
            { value: req.body, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Update active ads count
        await updateActiveAdsCount();
        
        // Log activity
        await new Activity({
            message: 'Banner ads updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'Banner ads saved successfully' });
    } catch (error) {
        console.error('Save banner ads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// VAST Ads Management
app.get('/api/settings/vast_ads', async (req, res) => {
    try {
        const vastAds = await Settings.findOne({ key: 'vast_ads' });
        res.json(vastAds ? vastAds.value : {});
    } catch (error) {
        console.error('VAST ads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Test VAST URL endpoint
app.post('/api/test-vast-url', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/xml, text/xml, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const contentType = response.headers.get('content-type');
        const content = await response.text();
        
        res.json({
            success: response.ok,
            status: response.status,
            contentType: contentType,
            contentLength: content.length,
            isVastXml: content.includes('<VAST'),
            hasLinear: content.includes('<Linear>'),
            hasMediaFile: content.includes('<MediaFile>'),
            contentPreview: content.substring(0, 1000)
        });
        
    } catch (error) {
        console.error('VAST URL test error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

app.post('/api/admin/ads/vast', authenticateToken, async (req, res) => {
    try {
        await Settings.findOneAndUpdate(
            { key: 'vast_ads' },
            { value: req.body, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Update active ads count
        await updateActiveAdsCount();
        
        // Log activity
        await new Activity({
            message: 'VAST ads updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'VAST ads saved successfully' });
    } catch (error) {
        console.error('Save VAST ads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reactions Management - REMOVED DUPLICATE ENDPOINTS

// Credentials Management
app.get('/api/admin/credentials', authenticateToken, async (req, res) => {
    try {
        const credentials = await Settings.findOne({ key: 'admin_credentials' });
        res.json(credentials ? credentials.value : {});
    } catch (error) {
        console.error('Credentials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/credentials', authenticateToken, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update admin credentials
        await Admin.findOneAndUpdate(
            { username: 'admin' },
            { 
                username: username || 'admin',
                password: hashedPassword,
                email: email || 'admin@example.com'
            },
            { upsert: true }
        );
        
        // Save to settings as well
        await Settings.findOneAndUpdate(
            { key: 'admin_credentials' },
            { 
                value: { username: username || 'admin', email: email || 'admin@example.com' },
                updatedAt: new Date() 
            },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: 'Admin credentials updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'Credentials updated successfully' });
    } catch (error) {
        console.error('Update credentials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Password Change Endpoint
app.post('/api/admin/credentials/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        
        // Get current admin credentials
        const admin = await Admin.findOne({ username: 'admin' });
        if (!admin) {
            return res.status(404).json({ message: 'Admin account not found' });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await Admin.findOneAndUpdate(
            { username: 'admin' },
            { password: hashedNewPassword }
        );
        
        // Log activity
        await new Activity({
            message: 'Admin password changed',
            type: 'security_update'
        }).save();
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API Settings Endpoint
app.get('/api/settings/api', async (req, res) => {
    try {
        const apiSettings = await Settings.findOne({ key: 'api_settings' });
        const defaultSettings = {
            apiBaseUrl: 'https://camgrabber-mb2q.onrender.com',
            websiteUrl: 'https://mmsbee.ilja.org',
            apiKey: '',
            serverPort: 3000,
            environment: 'production'
        };
        res.json(apiSettings ? apiSettings.value : defaultSettings);
    } catch (error) {
        console.error('API settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate Connection String Endpoint
app.post('/api/admin/credentials/generate-connection', authenticateToken, async (req, res) => {
    try {
        const { type, host, port, username, password, database, cluster } = req.body;
        
        let connectionString = '';
        let databaseName = database || 'video-streaming-app';
        
        if (type === 'local') {
            connectionString = generateConnectionString(host, port, username, password, databaseName);
        } else if (type === 'atlas') {
            connectionString = generateAtlasConnectionString(username, password, cluster, databaseName);
        } else {
            return res.status(400).json({ message: 'Invalid database type. Use "local" or "atlas"' });
        }
        
        res.json({ 
            connectionString,
            databaseName,
            message: 'Connection string generated successfully'
        });
        
    } catch (error) {
        console.error('Generate connection string error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Database Settings Endpoint
app.post('/api/admin/credentials/database', authenticateToken, async (req, res) => {
    try {
        const { databaseUri, databaseName } = req.body;
        
        // Validate connection string format
        if (!databaseUri || !databaseUri.includes('mongodb')) {
            return res.status(400).json({ message: 'Invalid MongoDB connection string' });
        }
        
        // Test the new connection before saving
        console.log('🔄 Testing new database connection...');
        const testConnection = await mongoose.createConnection(databaseUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: databaseName
        });
        
        await testConnection.close();
        console.log('✅ New database connection test successful');
        
        // Save database settings
        await Settings.findOneAndUpdate(
            { key: 'database_settings' },
            { 
                value: { databaseUri, databaseName },
                updatedAt: new Date() 
            },
            { upsert: true }
        );
        
        // Perform database migration
        const migrationResult = await migrateDatabase(databaseUri, databaseName);
        
        if (migrationResult.success) {
            // Update global variables
            global.MONGODB_URI = databaseUri;
            global.DATABASE_NAME = databaseName;
            
            // Log activity
            await new Activity({
                message: `Database migrated to ${databaseName}`,
                type: 'settings_update'
            }).save();
            
            res.json({ 
                message: 'Database settings updated and migration completed successfully',
                migrationResult: migrationResult.message
            });
        } else {
            res.status(500).json({ 
                message: 'Database settings saved but migration failed',
                error: migrationResult.message
            });
        }
        
    } catch (error) {
        console.error('Save database settings error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Ads Management
app.get('/api/admin/ads', authenticateToken, async (req, res) => {
    try {
        // Check for ads_settings first (new format)
        let adsSettings = await Settings.findOne({ key: 'ads_settings' });
        
        if (!adsSettings) {
            // Try to combine old format keys
            const bannerAds = await Settings.findOne({ key: 'banner_ads' });
            const vastAds = await Settings.findOne({ key: 'vast_ads' });
            
            if (bannerAds || vastAds) {
                const combinedSettings = {
                    banner: bannerAds ? bannerAds.value : {},
                    vast: vastAds ? vastAds.value : {}
                };
                res.json(combinedSettings);
                return;
            }
        }
        
        res.json(adsSettings ? adsSettings.value : {});
    } catch (error) {
        console.error('Ads settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/ads/vast', authenticateToken, async (req, res) => {
    try {
        const vastAds = req.body;
        const currentSettings = await Settings.findOne({ key: 'ads_settings' });
        const updatedSettings = {
            ...(currentSettings ? currentSettings.value : {}),
            vast: vastAds
        };
        
        await Settings.findOneAndUpdate(
            { key: 'ads_settings' },
            { value: updatedSettings, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: 'VAST ads updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'VAST ads saved successfully' });
    } catch (error) {
        console.error('Save VAST ads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/ads/banner', authenticateToken, async (req, res) => {
    try {
        const bannerAds = req.body;
        
        // Save to both old and new key names for compatibility
        await Settings.findOneAndUpdate(
            { key: 'banner_ads' },
            { value: bannerAds, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Also save to new format
        const currentSettings = await Settings.findOne({ key: 'ads_settings' });
        const updatedSettings = {
            ...(currentSettings ? currentSettings.value : {}),
            banner: bannerAds
        };
        
        await Settings.findOneAndUpdate(
            { key: 'ads_settings' },
            { value: updatedSettings, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: 'Banner ads updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'Banner ads saved successfully' });
    } catch (error) {
        console.error('Save banner ads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reactions Management
app.get('/api/admin/reactions', authenticateToken, async (req, res) => {
    try {
        // Get from reactions (the actual key in database)
        let reactionsSettings = await Settings.findOne({ key: 'reactions' });
        if (!reactionsSettings) {
            // Fallback to old key if needed
            reactionsSettings = await Settings.findOne({ key: 'reactions_settings' });
        }
        
        let reactions = reactionsSettings ? reactionsSettings.value : {};
        
        // Transform the data to match admin panel expected format
        // The database has the correct format already, just return it
        res.json(reactions);
    } catch (error) {
        console.error('Reactions settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Public endpoint for frontend to load reactions (no authentication required)
app.get('/api/settings/reactions', async (req, res) => {
    try {
        // Get from reactions (the actual key in database)
        let reactionsSettings = await Settings.findOne({ key: 'reactions' });
        if (!reactionsSettings) {
            // Fallback to old key if needed
            reactionsSettings = await Settings.findOne({ key: 'reactions_settings' });
        }
        
        let reactions = reactionsSettings ? reactionsSettings.value : {};
        
        // Transform the data to match expected format
        // The database has the correct format already, just return it
        res.json(reactions);
    } catch (error) {
        console.error('Reactions settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Public endpoint for frontend to load metadata (no authentication required)
app.get('/api/settings/metadata', async (req, res) => {
    try {
        // Get from website_metadata (the actual key in database)
        let metadataSettings = await Settings.findOne({ key: 'website_metadata' });
        if (!metadataSettings) {
            // Fallback to old key if needed
            metadataSettings = await Settings.findOne({ key: 'metadata_settings' });
        }
        
        // Transform the data to match expected format
        let metadata = metadataSettings ? metadataSettings.value : {};
        
        // If using website_metadata format, transform it
        if (metadataSettings && metadataSettings.key === 'website_metadata') {
            metadata = {
                websiteTitle: metadata.siteTitle || 'Video Streaming App',
                websiteDescription: metadata.siteDescription || 'Stream and download videos from various sources',
                websiteKeywords: metadata.siteKeywords || 'video, streaming, download, mp4',
                websiteAuthor: metadata.siteAuthor || '',
                ogTitle: metadata.siteTitle || 'Video Streaming App',
                ogDescription: metadata.siteDescription || 'Stream and download videos from various sources',
                ogImage: '',
                twitterCard: 'summary',
                faviconUrl: '',
                canonicalUrl: '',
                robotsMeta: 'index,follow',
                viewportMeta: 'width=device-width, initial-scale=1.0',
                googleAnalyticsId: '',
                googleTagManagerId: '',
                customHeadScripts: '',
                customBodyScripts: ''
            };
        }
        
        res.json(metadata);
    } catch (error) {
        console.error('Metadata settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Public endpoint for frontend to load page titles (no authentication required)
app.get('/api/settings/page_titles', async (req, res) => {
    try {
        // Get from page_titles (the actual key in database)
        let pageTitlesSettings = await Settings.findOne({ key: 'page_titles' });
        if (!pageTitlesSettings) {
            // Fallback to old key if needed
            pageTitlesSettings = await Settings.findOne({ key: 'page_titles_settings' });
        }
        
        let pageTitles = pageTitlesSettings ? pageTitlesSettings.value : {};
        
        // Transform the data to match expected format
        const transformedPageTitles = {
            homepage: {
                title: pageTitles.homepage?.title || 'Video Streaming App',
                subtitle: pageTitles.homepage?.subtitle || 'Stream and download videos from various sources'
            },
            streaming: {
                title: pageTitles.streaming?.title || pageTitles.stream?.title || 'Video Streaming',
                subtitle: pageTitles.streaming?.subtitle || pageTitles.stream?.subtitle || 'Watch and download videos in high quality'
            },
            admin: {
                title: pageTitles.admin?.title || 'Admin Dashboard',
                subtitle: pageTitles.admin?.subtitle || 'Manage your application settings'
            },
            login: {
                title: pageTitles.login?.title || 'Admin Login',
                subtitle: pageTitles.login?.subtitle || 'Enter your credentials to access the admin panel'
            }
        };
        
        res.json(transformedPageTitles);
    } catch (error) {
        console.error('Page titles settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/reactions', authenticateToken, async (req, res) => {
    try {
        const reactions = req.body;
        
        await Settings.findOneAndUpdate(
            { key: 'reactions' },
            { value: reactions, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: 'Reactions updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'Reactions saved successfully' });
    } catch (error) {
        console.error('Save reactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API Settings Management
app.get('/api/admin/api', authenticateToken, async (req, res) => {
    try {
        const apiSettings = await Settings.findOne({ key: 'api_settings' });
        res.json(apiSettings ? apiSettings.value : {});
    } catch (error) {
        console.error('API settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/api', authenticateToken, async (req, res) => {
    try {
        const { apiBaseUrl, apiKey, serverPort, environment } = req.body;
        
        // Validate API Base URL
        if (!apiBaseUrl || !apiBaseUrl.startsWith('http')) {
            return res.status(400).json({ message: 'Invalid API Base URL. Must start with http:// or https://' });
        }
        
        await Settings.findOneAndUpdate(
            { key: 'api_settings' },
            { 
                value: { apiBaseUrl, apiKey, serverPort, environment },
                updatedAt: new Date() 
            },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: `API settings updated - Base URL: ${apiBaseUrl}`,
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'API settings saved successfully' });
    } catch (error) {
        console.error('Save API settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Server Settings Management
app.get('/api/admin/server', authenticateToken, async (req, res) => {
    try {
        const serverSettings = await Settings.findOne({ key: 'server_settings' });
        res.json(serverSettings ? serverSettings.value : {});
    } catch (error) {
        console.error('Server settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/server', authenticateToken, async (req, res) => {
    try {
        await Settings.findOneAndUpdate(
            { key: 'server_settings' },
            { value: req.body, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: 'Server settings updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'Server settings saved successfully' });
    } catch (error) {
        console.error('Save server settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Metadata Management
app.get('/api/admin/metadata', async (req, res) => {
    try {
        const metadata = await Settings.findOne({ key: 'website_metadata' });
        let metadataData = metadata ? metadata.value : {};
        
        // Transform the data to match admin panel expected format
        const transformedMetadata = {
            websiteTitle: metadataData.siteTitle || 'Video Streaming App',
            websiteDescription: metadataData.siteDescription || 'Stream and download videos from various sources',
            websiteKeywords: metadataData.siteKeywords || 'video, streaming, download, mp4',
            websiteAuthor: metadataData.siteAuthor || '',
            ogTitle: metadataData.ogTitle || metadataData.siteTitle || 'Video Streaming App',
            ogDescription: metadataData.ogDescription || metadataData.siteDescription || 'Stream and download videos from various sources',
            ogImage: metadataData.ogImage || '',
            twitterCard: metadataData.twitterCard || 'summary',
            faviconUrl: metadataData.faviconUrl || '',
            canonicalUrl: metadataData.canonicalUrl || '',
            robotsMeta: metadataData.robotsMeta || 'index,follow',
            viewportMeta: metadataData.viewportMeta || 'width=device-width, initial-scale=1.0',
            googleAnalyticsId: metadataData.googleAnalyticsId || '',
            googleTagManagerId: metadataData.googleTagManagerId || '',
            customHeadScripts: metadataData.customHeadScripts || '',
            customBodyScripts: metadataData.customBodyScripts || ''
        };
        
        res.json(transformedMetadata);
    } catch (error) {
        console.error('Metadata settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/metadata', authenticateToken, async (req, res) => {
    try {
        // Transform the data to match the database format
        const metadata = {
            siteTitle: req.body.websiteTitle || 'Video Streaming App',
            siteDescription: req.body.websiteDescription || 'Stream and download videos from various sources',
            siteKeywords: req.body.websiteKeywords || 'video, streaming, download, mp4',
            siteAuthor: req.body.websiteAuthor || '',
            // Keep additional fields for future use
            ogTitle: req.body.ogTitle,
            ogDescription: req.body.ogDescription,
            ogImage: req.body.ogImage,
            twitterCard: req.body.twitterCard,
            faviconUrl: req.body.faviconUrl,
            canonicalUrl: req.body.canonicalUrl,
            robotsMeta: req.body.robotsMeta,
            viewportMeta: req.body.viewportMeta,
            googleAnalyticsId: req.body.googleAnalyticsId,
            googleTagManagerId: req.body.googleTagManagerId,
            customHeadScripts: req.body.customHeadScripts,
            customBodyScripts: req.body.customBodyScripts
        };
        
        await Settings.findOneAndUpdate(
            { key: 'website_metadata' },
            { value: metadata, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: 'Website metadata updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'Metadata saved successfully' });
    } catch (error) {
        console.error('Save metadata error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Page Titles Management
app.get('/api/admin/page_titles', async (req, res) => {
    try {
        const pageTitles = await Settings.findOne({ key: 'page_titles' });
        let pageTitlesData = pageTitles ? pageTitles.value : {};
        
        // Transform the data to match admin panel expected format
        const transformedPageTitles = {
            homepage: {
                title: pageTitlesData.homepage?.title || 'Video Streaming App',
                subtitle: pageTitlesData.homepage?.subtitle || 'Stream and download videos from various sources'
            },
            streaming: {
                title: pageTitlesData.streaming?.title || pageTitlesData.stream?.title || 'Video Streaming',
                subtitle: pageTitlesData.streaming?.subtitle || pageTitlesData.stream?.subtitle || 'Watch and download videos in high quality'
            },
            admin: {
                title: pageTitlesData.admin?.title || 'Admin Dashboard',
                subtitle: pageTitlesData.admin?.subtitle || 'Manage your application settings'
            },
            login: {
                title: pageTitlesData.login?.title || 'Admin Login',
                subtitle: pageTitlesData.login?.subtitle || 'Enter your credentials to access the admin panel'
            }
        };
        
        res.json(transformedPageTitles);
    } catch (error) {
        console.error('Page titles error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/page_titles', authenticateToken, async (req, res) => {
    try {
        await Settings.findOneAndUpdate(
            { key: 'page_titles' },
            { value: req.body, updatedAt: new Date() },
            { upsert: true }
        );
        
        // Log activity
        await new Activity({
            message: 'Page titles updated',
            type: 'settings_update'
        }).save();
        
        res.json({ message: 'Page titles saved successfully' });
    } catch (error) {
        console.error('Save page titles error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Page Routes (must come after API routes)
app.get('/', async (req, res) => {
    try {
        // Get metadata from database
        const metadata = await Settings.findOne({ key: 'website_metadata' });
        const metadataData = metadata ? metadata.value : {};
        
        // Read the HTML file
        let html = require('fs').readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
        // Replace metadata placeholders
        html = html.replace(/<title>.*?<\/title>/, `<title>${metadataData.websiteTitle || 'Video Streaming App'}</title>`);
        html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${metadataData.websiteDescription || 'Stream and download videos from various sources'}">`);
        html = html.replace(/<meta name="keywords" content=".*?">/, `<meta name="keywords" content="${metadataData.websiteKeywords || 'video, streaming, download, mp4'}">`);
        html = html.replace(/<meta name="author" content=".*?">/, `<meta name="author" content="${metadataData.websiteAuthor || ''}">`);
        
        // Add Open Graph tags
        if (metadataData.ogTitle || metadataData.ogDescription || metadataData.ogImage) {
            const ogTags = `
                <meta property="og:title" content="${metadataData.ogTitle || metadataData.websiteTitle || 'Video Streaming App'}">
                <meta property="og:description" content="${metadataData.ogDescription || metadataData.websiteDescription || 'Stream and download videos from various sources'}">
                ${metadataData.ogImage ? `<meta property="og:image" content="${metadataData.ogImage}">` : ''}
                <meta property="og:type" content="website">
            `;
            html = html.replace('</head>', `${ogTags}\n</head>`);
        }
        
        // Add Twitter Card tags
        if (metadataData.twitterCard) {
            const twitterTags = `
                <meta name="twitter:card" content="${metadataData.twitterCard}">
                <meta name="twitter:title" content="${metadataData.ogTitle || metadataData.websiteTitle || 'Video Streaming App'}">
                <meta name="twitter:description" content="${metadataData.ogDescription || metadataData.websiteDescription || 'Stream and download videos from various sources'}">
                ${metadataData.ogImage ? `<meta name="twitter:image" content="${metadataData.ogImage}">` : ''}
            `;
            html = html.replace('</head>', `${twitterTags}\n</head>`);
        }
        
        // Add favicon
        if (metadataData.faviconUrl) {
            html = html.replace('</head>', `<link rel="icon" href="${metadataData.faviconUrl}">\n</head>`);
        }
        
        // Add canonical URL
        if (metadataData.canonicalUrl) {
            html = html.replace('</head>', `<link rel="canonical" href="${metadataData.canonicalUrl}">\n</head>`);
        }
        
        // Add robots meta
        if (metadataData.robotsMeta) {
            html = html.replace('</head>', `<meta name="robots" content="${metadataData.robotsMeta}">\n</head>`);
        }
        
        // Add viewport meta
        if (metadataData.viewportMeta) {
            html = html.replace(/<meta name="viewport" content=".*?">/, `<meta name="viewport" content="${metadataData.viewportMeta}">`);
        }
        
        // Add Google Analytics
        if (metadataData.googleAnalyticsId) {
            const gaScript = `
                <!-- Google Analytics -->
                <script async src="https://www.googletagmanager.com/gtag/js?id=${metadataData.googleAnalyticsId}"></script>
                <script>
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${metadataData.googleAnalyticsId}');
                </script>
            `;
            html = html.replace('</head>', `${gaScript}\n</head>`);
        }
        
        // Add Google Tag Manager
        if (metadataData.googleTagManagerId) {
            const gtmScript = `
                <!-- Google Tag Manager -->
                <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${metadataData.googleTagManagerId}');</script>
            `;
            html = html.replace('</head>', `${gtmScript}\n</head>`);
        }
        
        // Add custom head scripts
        if (metadataData.customHeadScripts) {
            html = html.replace('</head>', `${metadataData.customHeadScripts}\n</head>`);
        }
        
        // Add custom body scripts
        if (metadataData.customBodyScripts) {
            html = html.replace('</body>', `${metadataData.customBodyScripts}\n</body>`);
        }
        
        // Get page titles from database
        const pageTitles = await Settings.findOne({ key: 'page_titles' });
        const titlesData = pageTitles ? pageTitles.value : {};
        
        // Replace homepage title placeholders
        const homepageTitle = titlesData.homepage?.title || 'YouTube Video Downloader';
        const homepageSubtitle = titlesData.homepage?.subtitle || 'Download YouTube videos in high quality for free';
        
        html = html.replace(/<h1>🎬 YouTube Video Downloader<\/h1>/, `<h1>🎬 ${homepageTitle}</h1>`);
        html = html.replace(/<p>Download YouTube videos in high quality for free<\/p>/, `<p>${homepageSubtitle}</p>`);
        
        res.send(html);
    } catch (error) {
        console.error('Error serving dynamic HTML:', error);
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.get('/stream', async (req, res) => {
    try {
        // Get page titles from database
        const pageTitles = await Settings.findOne({ key: 'page_titles' });
        const titlesData = pageTitles ? pageTitles.value : {};
        
        // Read the HTML file
        let html = require('fs').readFileSync(path.join(__dirname, 'stream.html'), 'utf8');
        
        // Replace page title placeholders
        const streamingTitle = titlesData.streaming?.title || 'Video Streaming';
        const streamingSubtitle = titlesData.streaming?.subtitle || 'Watch and download videos in high quality';
        
        html = html.replace(/<h1 id="pageTitle">.*?<\/h1>/, `<h1 id="pageTitle">${streamingTitle}</h1>`);
        html = html.replace(/<p id="pageSubtitle">.*?<\/p>/, `<p id="pageSubtitle">${streamingSubtitle}</p>`);
        
        res.send(html);
    } catch (error) {
        console.error('Error serving dynamic stream HTML:', error);
        res.sendFile(path.join(__dirname, 'stream.html'));
    }
});

app.get('/admin', async (req, res) => {
    try {
        // Get page titles from database
        const pageTitles = await Settings.findOne({ key: 'page_titles' });
        const titlesData = pageTitles ? pageTitles.value : {};
        
        // Read the HTML file
        let html = require('fs').readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
        
        // Replace page title placeholders
        const adminTitle = titlesData.admin?.title || 'Admin Dashboard';
        const adminSubtitle = titlesData.admin?.subtitle || 'Manage your application settings';
        
        html = html.replace(/<title>Admin Dashboard - Video Streaming App<\/title>/, `<title>${adminTitle} - Video Streaming App</title>`);
        html = html.replace(/<h1 class="text-3xl font-bold mb-6">Admin Dashboard<\/h1>/, `<h1 class="text-3xl font-bold mb-6">${adminTitle}</h1>`);
        
        res.send(html);
    } catch (error) {
        console.error('Error serving dynamic admin HTML:', error);
        res.sendFile(path.join(__dirname, 'admin.html'));
    }
});

app.get('/admin-login.html', async (req, res) => {
    try {
        // Get page titles from database
        const pageTitles = await Settings.findOne({ key: 'page_titles' });
        const titlesData = pageTitles ? pageTitles.value : {};
        
        // Read the HTML file
        let html = require('fs').readFileSync(path.join(__dirname, 'admin-login.html'), 'utf8');
        
        // Replace page title placeholders
        const loginTitle = titlesData.login?.title || 'Admin Login';
        const loginSubtitle = titlesData.login?.subtitle || 'Enter your credentials to access the admin panel';
        
        html = html.replace(/<title>Admin Login - Video Streaming App<\/title>/, `<title>${loginTitle} - Video Streaming App</title>`);
        html = html.replace(/<h1 class="text-3xl font-bold mb-2">🔧 Admin Login<\/h1>/, `<h1 class="text-3xl font-bold mb-2">🔧 ${loginTitle}</h1>`);
        html = html.replace(/<p class="text-gray-300">Enter your credentials to access the admin panel<\/p>/, `<p class="text-gray-300">${loginSubtitle}</p>`);
        
        res.send(html);
    } catch (error) {
        console.error('Error serving dynamic login HTML:', error);
        res.sendFile(path.join(__dirname, 'admin-login.html'));
    }
});

// Activity Logs
app.get('/api/admin/activity', authenticateToken, async (req, res) => {
    try {
        const activities = await Activity.find().sort({ timestamp: -1 }).limit(50);
        res.json(activities);
    } catch (error) {
        console.error('Activity logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// WebSocket message handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    clients.add(ws);

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'settings_update') {
                // Broadcast to all connected clients
                broadcastToClients({
                    type: 'settings_updated',
                    section: data.section,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(ws);
    });
});

// Proxy endpoint for API requests (to avoid mixed content issues)
app.get('/api/proxy/file/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const response = await fetch(`https://camgrabber-mb2q.onrender.com/api/file/${fileId}`);
        
        if (response.ok) {
            const data = await response.json();
            res.json(data);
        } else {
            res.status(response.status).json({ 
                success: false, 
                error: 'File not found', 
                code: response.status 
            });
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Proxy error', 
            code: 500 
        });
    }
});

// Proxy endpoint for streaming
app.get('/api/proxy/watch/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const response = await fetch(`https://camgrabber-mb2q.onrender.com/watch/${fileId}`);
        
        if (response.ok) {
            // Forward the video stream
            res.setHeader('Content-Type', 'video/mp4');
            response.body.pipe(res);
        } else {
            res.status(response.status).json({ 
                success: false, 
                error: 'Video not found', 
                code: response.status 
            });
        }
    } catch (error) {
        console.error('Streaming proxy error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Streaming proxy error', 
            code: 500 
        });
    }
});

// Proxy endpoint for downloads
app.get('/api/proxy/dl/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const response = await fetch(`https://camgrabber-mb2q.onrender.com/dl/${fileId}`);
        
        if (response.ok) {
            // Forward the download
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="video_${fileId}.mp4"`);
            response.body.pipe(res);
        } else {
            res.status(response.status).json({ 
                success: false, 
                error: 'File not found', 
                code: response.status 
            });
        }
    } catch (error) {
        console.error('Download proxy error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Download proxy error', 
            code: 500 
        });
    }
});

// Direct streaming endpoint
app.get('/watch/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        console.log(`🎬 Streaming request for file ID: ${fileId}`);
        
        const response = await fetch(`https://camgrabber-mb2q.onrender.com/watch/${fileId}`);
        
        console.log(`📡 External streaming response status: ${response.status}`);
        
        if (response.ok) {
            // Forward the video stream with proper headers
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Disposition', 'inline'); // Force inline display instead of download
            
            // Copy any range headers from the external response
            const contentRange = response.headers.get('content-range');
            if (contentRange) {
                res.setHeader('Content-Range', contentRange);
            }
            
            console.log(`✅ Starting video stream for ${fileId}`);
            response.body.pipe(res);
        } else {
            console.log(`❌ External streaming error: ${response.status}`);
            const errorText = await response.text();
            console.log(`❌ Error response:`, errorText);
            
            res.status(response.status).json({ 
                success: false, 
                error: 'Video not found', 
                code: response.status 
            });
        }
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Streaming error', 
            code: 500 
        });
    }
});

// Direct download endpoint
app.get('/dl/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const response = await fetch(`https://camgrabber-mb2q.onrender.com/dl/${fileId}`);
        
        if (response.ok) {
            // Forward the download
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="video_${fileId}.mp4"`);
            response.body.pipe(res);
        } else {
            res.status(response.status).json({ 
                success: false, 
                error: 'File not found', 
                code: response.status 
            });
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Download error', 
            code: 500 
        });
    }
});

// Direct file information endpoint
app.get('/api/file/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        console.log(`🔍 Fetching file info for ID: ${fileId} from external API`);
        
        const response = await fetch(`https://camgrabber-mb2q.onrender.com/api/file/${fileId}`);
        
        console.log(`📡 External API response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ File info received:`, data);
            res.json(data);
        } else {
            console.log(`❌ External API error: ${response.status}`);
            const errorText = await response.text();
            console.log(`❌ Error response:`, errorText);
            res.status(response.status).json({ 
                success: false, 
                error: 'File not found', 
                code: response.status 
            });
        }
    } catch (error) {
        console.error('File info error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'File info error', 
            code: 500 
        });
    }
});

// Video Download Endpoint
app.get('/dl/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        // Get file info from your video service
        const fileInfo = await getFileInfo(fileId);
        
        if (!fileInfo) {
            return res.status(404).json({ message: 'Video not found' });
        }
        
        // Set headers for download
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.title}.mp4"`);
        
        // Redirect to the actual video URL or stream the video
        // For now, we'll redirect to the video URL
        res.redirect(fileInfo.downloadUrl || fileInfo.streamUrl);
        
        // Track download
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats();
        }
        stats.totalDownloads++;
        await stats.save();
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Download failed' });
    }
});

// Bot Download Endpoint (for bot-generated links)
app.get('/download', async (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ message: 'File ID is required' });
        }
        
        // Get file info from your video service
        const fileInfo = await getFileInfo(id);
        
        if (!fileInfo) {
            return res.status(404).json({ message: 'Video not found' });
        }
        
        // Set headers for download
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.title}.mp4"`);
        
        // Redirect to the actual video URL or stream the video
        // For now, we'll redirect to the video URL
        res.redirect(fileInfo.downloadUrl || fileInfo.streamUrl);
        
        // Track download
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats();
        }
        stats.totalDownloads++;
        await stats.save();
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Download failed' });
    }
});

// Helper function to get file info (you'll need to implement this based on your video service)
async function getFileInfo(fileId) {
    // This should connect to your video service API
    try {
        const response = await fetch(`https://camgrabber-mb2q.onrender.com/api/file/${fileId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching file info:', error);
        return null;
    }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
}); 
