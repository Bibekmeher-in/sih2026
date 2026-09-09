import mongoose from 'mongoose';

await mongoose.connect('mongodb://127.0.0.1:27017/kisandirect');
const db = mongoose.connection.db;

// Find all products where category is not an ObjectId
const allProds = await db.collection('products').find({}).toArray();
console.log('Total products:', allProds.length);

let deletedCount = 0;
for (const p of allProds) {
  if (typeof p.category === 'string' || !(p.category instanceof mongoose.Types.ObjectId)) {
    console.log('Removing non-ObjectId category product:', p._id, p.name, p.category);
    await db.collection('products').deleteOne({ _id: p._id });
    deletedCount++;
  }
}
console.log(`Cleaned up ${deletedCount} rogue products.`);
await mongoose.disconnect();
