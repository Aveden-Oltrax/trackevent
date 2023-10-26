import { MongoClient } from 'mongodb';
import {connectToDb} from "./connection.mjs";
import express from 'express';
import cors from 'cors';
const app = express();
const port = 3001;

const url = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'myDB'; // Replace with your database name
const client = new MongoClient(url);

app.use(express.json());
app.use(cors());
connectToDb();
const db = client.db(dbName);

app.post('/sendData', (req, res) => {
  const receivedData = req.body; 
  const collection = db.collection('events'); // Replace 'mycollection' with your collection name
  
  if (receivedData) {
    collection.insertMany(receivedData, (err, result) => {
      if (err) {
        console.error('Error inserting document:', err);
        return;
      }
      console.log('Document inserted successfully');
      console.log(result.ops);
    });
    console.log('Received data:', receivedData);
    res.status(200).send('Data received and processed.');
  }
  
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});