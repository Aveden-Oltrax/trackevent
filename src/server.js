const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // Import the cors middleware

const app = express();
const port = 3000;

// // Define a schema for the data
// const trackingSchema = new mongoose.Schema({
//   userInfo: {
//     appCodeName: String,
//     appName: String,
//     vendor: String,
//     platform: String,
//     userAgent: String,
//   },
//   time: {
//     totalTime: Number,
//     timeOnPage: Number,
//   },
//   clicks: {
//     clickCount: Number,
//     clickDetails: [
//       {
//         timestamp: Number,
//         node: String,
//         x: Number,
//         y: Number,
//       },
//     ],
//   },
//   mouseMovements: [
//     {
//       timestamp: Number,
//       x: Number,
//       y: Number,
//     },
//   ],
//   geoLocation: {
//     latitude: Number,
//     longitude: Number,
//   },
//   contextChange: [
//     {
//       timestamp: Number,
//       type: String,
//     },
//   ],
//   keyLog: [
//     {
//       timestamp: Number,
//       data: String,
//       type: String,
//     },
//   ],
// });

// Define a schema for unstructured data
const trackingSchema = new mongoose.Schema({
  unstructuredData: mongoose.Schema.Types.Mixed,
});

// Create a model using the schema
const TrackingModel = mongoose.model("events", trackingSchema);

// Connect to MongoDB
mongoose.connect("mongodb://localhost/myDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use the cors middleware to allow cross-origin requests
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to receive and store data
app.post("/store-data", (req, res) => {
  const data = req.body;

  // Create a new document using the model and save it to MongoDB
  const trackingData = new TrackingModel(data);

  trackingData
    .save()
    .then(() => {
      console.log("Data stored successfully");
      res.status(200).send("Data stored successfully");
    })
    .catch((err) => {
      console.error("Error storing data:", err);
      res.status(500).send("Error storing data");
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
