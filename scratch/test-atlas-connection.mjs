import mongoose from "mongoose";

const userUri = "mongodb+srv://bibekanandam958_db_user:IPESxJ57ODwGceGB@cluster0.oapv8vk.mongodb.net/KISANOVA?retryWrites=true&w=majority&appName=Cluster0";
const rawUri = "mongodb+srv://bibekanandam958_db_user:IPESxJ57ODwGceGB@cluster0.oapv8vk.mongodb.net/?appName=Cluster0";

async function testConnection(uri, label) {
  console.log(`\nTesting connection with ${label}...`);
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✓ Successfully connected to MongoDB Atlas! [${label}]`);
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);

    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`  Existing Collections (${collections.length}):`, collections.map(c => c.name));

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(`❌ Connection failed with ${label}:`, err.message);
    return false;
  }
}

async function run() {
  const ok1 = await testConnection(userUri, "URI with /KISANOVA database");
  if (!ok1) {
    console.log("Trying raw user URI...");
    await testConnection(rawUri, "Raw user URI");
  }
}

run();
