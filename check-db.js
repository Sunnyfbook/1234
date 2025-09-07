const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://sunnyfbook21:pY62CnoJaudg1wXt@cluster0.brruqsz.mongodb.net/?retryWrites=true&w=majority";
const DATABASE_NAME = "cluster0";

async function checkDatabase() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: DATABASE_NAME
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Check all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📋 Collections in database:');
        collections.forEach(col => console.log(`- ${col.name}`));
        
        // Check settings collection
        const settings = await mongoose.connection.db.collection('settings').find({}).toArray();
        console.log('\n⚙️ All settings in database:');
        if (settings.length === 0) {
            console.log('❌ No settings found in database');
        } else {
            settings.forEach(setting => {
                console.log(`\n🔑 Key: ${setting.key}`);
                console.log(`📅 Updated: ${setting.updatedAt}`);
                console.log(`📄 Value:`, JSON.stringify(setting.value, null, 2));
            });
        }
        
        // Check admin collection
        const admins = await mongoose.connection.db.collection('admins').find({}).toArray();
        console.log('\n👤 Admin users:');
        if (admins.length === 0) {
            console.log('❌ No admin users found');
        } else {
            admins.forEach(admin => {
                console.log(`- Username: ${admin.username}, Email: ${admin.email}, Role: ${admin.role}`);
            });
        }
        
        // Check stats collection
        const stats = await mongoose.connection.db.collection('stats').find({}).toArray();
        console.log('\n📊 Stats:');
        if (stats.length === 0) {
            console.log('❌ No stats found');
        } else {
            stats.forEach(stat => {
                console.log(`- Views: ${stat.totalViews}, Downloads: ${stat.totalDownloads}, Reactions: ${stat.totalReactions}, Active Ads: ${stat.activeAds}`);
            });
        }
        
        // Check activities collection
        const activities = await mongoose.connection.db.collection('activities').find({}).toArray();
        console.log('\n📝 Recent activities:');
        if (activities.length === 0) {
            console.log('❌ No activities found');
        } else {
            activities.slice(-5).forEach(activity => {
                console.log(`- ${activity.timestamp}: ${activity.message} (${activity.type})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

checkDatabase(); 