import mongoose from "mongoose";

const LOCAL_URI = "mongodb://127.0.0.1:27017/KISANOVA";
const ATLAS_URI = "mongodb+srv://bibekanandam958_db_user:IPESxJ57ODwGceGB@cluster0.oapv8vk.mongodb.net/KISANOVA?retryWrites=true&w=majority&appName=Cluster0";

async function migrate() {
  console.log("===============================================================================");
  console.log("   SEEDING AND MIGRATING ALL DATA TO ORIGINAL MONGODB ATLAS CLUSTER");
  console.log("===============================================================================\n");

  console.log("Connecting to Source Local MongoDB:", LOCAL_URI);
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const localDb = localConn.db;
  console.log("✓ Connected to Local Database");

  console.log("\nConnecting to Target MongoDB Atlas Cluster:", ATLAS_URI.replace(/:[^:@]+@/, ":****@"));
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  const atlasDb = atlasConn.db;
  console.log("✓ Connected to Atlas Database:", atlasDb.databaseName);

  const collections = await localDb.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections to seed into Atlas.\n`);

  let totalDocsMigrated = 0;

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith("system.")) continue;

    console.log(`--- Migrating Collection: ${colName} ---`);
    const sourceCol = localDb.collection(colName);
    const targetCol = atlasDb.collection(colName);

    // Fetch all documents from local
    const docs = await sourceCol.find({}).toArray();
    console.log(`  Found ${docs.length} documents in local ${colName}`);

    if (docs.length > 0) {
      // Clear target collection before seeding fresh data
      await targetCol.deleteMany({});
      // Insert all documents
      const insertResult = await targetCol.insertMany(docs);
      console.log(`  ✓ Successfully inserted ${insertResult.insertedCount} documents into Atlas ${colName}`);
      totalDocsMigrated += insertResult.insertedCount;
    }

    // Migrate indexes
    try {
      const indexes = await sourceCol.indexes();
      for (const idx of indexes) {
        if (idx.name === "_id_") continue; // Default index
        const { key, name, unique, sparse } = idx;
        const options = { name };
        if (unique) options.unique = true;
        if (sparse) options.sparse = true;

        try {
          await targetCol.createIndex(key, options);
          console.log(`  ✓ Recreated index: ${name} (${JSON.stringify(key)})`);
        } catch (idxErr) {
          console.warn(`  ⚠ Warning recreating index ${name}:`, idxErr.message);
        }
      }
    } catch (err) {
      console.warn(`  Could not read indexes for ${colName}:`, err.message);
    }
  }

  console.log("\n===============================================================================");
  console.log(`   🎉 ATLAS SEEDING COMPLETE! Total Documents Seeded: ${totalDocsMigrated}`);
  console.log("===============================================================================\n");

  // Summary verification
  console.log("Verifying Atlas Collections & Counts:");
  const atlasCols = await atlasDb.listCollections().toArray();
  for (const c of atlasCols) {
    const count = await atlasDb.collection(c.name).countDocuments();
    console.log(`  • ${c.name}: ${count} docs`);
  }

  await localConn.close();
  await atlasConn.close();
  console.log("\n✓ Database connections cleanly closed.");
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
