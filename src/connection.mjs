import { MongoClient } from 'mongodb';

const url = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'myDB'; // Replace with your database name
const client = new MongoClient(url);

export function connectToDb() {
    client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
}