const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());


// JWT verify

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized users' })
  }

  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized users' })
    }
    req.decoded = decoded;
    next()
  })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // Add a new collection for code snippets
    const snippetsCollection = client.db("code-dock").collection("snippets");

    console.log("snippetsCollection created:", snippetsCollection.collectionName);


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })



    // Create a new code snippet
    app.post("/snippets", async (req, res) => {
      const newSnippet = req.body;
      console.log(newSnippet);
      const result = await snippetsCollection.insertOne(newSnippet);
      res.send(result);
    });


    // Get all code snippets
    app.get('/snippets', async (req, res) => {
      const result = await snippetsCollection.find().toArray();
      res.send(result);
    })



    app.get('/snippets/:id', async (req, res) => {
      const id = req.params.id;

      // Validate the ID format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      try {
        const query = { _id: new ObjectId(id) }
        const result = await snippetsCollection.findOne(query);
        if (result) {
          res.send(result);
        } else {
          res.status(404).json({ message: 'Snippet not found' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });


    // Saved user API

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      user.role = "user"
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })



    //create a new repository
    app.post("/new", async (req, res) => {
      const repoDetails = req.body;
      console.log(repoDetails);

      const result = await repositoriesCollection.insertOne(repoDetails);
      res.send(result);
    });

    //get all repositories
    app.get('/repositories', verifyJWT, async (req, res) => {
      const result = await repositoriesCollection.find().toArray();
      res.send(result);
    })




    // CREATE A NEW REPO 

    // app.post("/new", async (req, res) => {
    //   const repoDetails = req.body;
    //   console.log(repoDetails);

    //   const result = await repositoriesCollection.insertOne(repoDetails);
    //   res.send(result);
    // });

    app.post("/new", async (req, res) => {
      const repoDetails = req.body;

      const result = await repositoriesCollection.insertOne(repoDetails);
      res.status(201).json({ message: 'Repository created successfully', repo: result });
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
  res.send('CodeDock is Running')
})

app.listen(port, () => {
  console.log(`Running on port ${port}`);
})