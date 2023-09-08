const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dznbzjy.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    //database collection
    const usersCollection = client.db("code-dock").collection("users");
    const repositoriesCollection = client.db("code-dock").collection("repositories");

    //create a new repository
    app.post("/repositories", async (req, res) => {
      const repoDetails = req.body;
      // console.log(repoDetails);

      const result = await repositoriesCollection.insertOne(repoDetails);
      res.send(result);

    });
    app.get("/myRepositories/:email", async (req, res) => {
      const email = req?.params?.email;
      const query = { email: email }
      // const options = {
      //   sort: { _id: -1 }
      // }
      const result = await repositoriesCollection.find(query).toArray();
      res.send(result);

    });
    app.get("/allRepositories", async (req, res) => {
      const query = {}
      // const options = {
      //   sort: { _id: -1 }
      // }
      const result = await repositoriesCollection.find(query).toArray();
      res.send(result);
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

//test
app.get('/', (req, res) => {
  res.send('Running')
})

app.listen(port, () => {
  console.log(`Running on port ${port}`);
})