// import { MongoClient } from "mongodb";

// const testConnection = async () => {
//   const client = new MongoClient("mongodb://localhost:27017");

//   try {
//     await client.connect();
//     console.log("✅ Connected to MongoDB from sortingTest!");

//     const db = client.db("sortingTestDB");
//     const collection = db.collection("test");

//     await collection.insertOne({ message: "Hello from sortingTest!" });
//     console.log("✅ Data inserted!");
//   } catch (error) {
//     console.error("❌ Connection failed:", error);
//   } finally {
//     await client.close();
//   }
// };

// testConnection();
