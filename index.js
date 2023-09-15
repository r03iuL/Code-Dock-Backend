const express = require('express');

const bodyParser = require('body-parser');


const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


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
    const messages = client.db("code-dock").collection("message");
    // Add a new collection for code snippets
    const snippetsCollection = client.db("code-dock").collection("snippets");
    const updateProfileCollection = client.db("code-dock").collection("profile");

    // console.log("snippetsCollection created:", snippetsCollection.collectionName);


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })

    // Create new repository
    app.post("/repositories", async (req, res) => {
      const repoDetails = req.body;
      const result = await repositoriesCollection.insertOne(repoDetails);
      res.send(result);
    });

    // app.post("/new", async (req, res) => {
    //   const repoDetails = req.body;

    //   const result = await repositoriesCollection.insertOne(repoDetails);
    //   res.status(201).json({ message: 'Repository created successfully', repo: result });
    // });

  

    
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


    //get all repositories
    app.get('/repositories', async (req, res) => {
      const result = await repositoriesCollection.find().toArray();
      res.send(result);
    })

    //get all repositories
    app.get('/repositories', async (req, res) => {
      const result = await repositoriesCollection.find().toArray();
      res.send(result);
    })

    // get user repositories by user's email
    app.get("/myRepositories/:email", async (req, res) => {
        const email = req?.params?.email;
        const query = { email: email }
        // const options = {
        //   sort: { _id: -1 }
        // }
        const result = await repositoriesCollection.find(query).toArray();
        res.send(result);
  
      });
    // get user repositories by user's email
    app.get("/myRepositoriesId/:id", async (req, res) => {
        const id = req?.params?.id;
        // console.log(id)
        const query = {_id: new ObjectId(id)}
        // const options = {
        //   sort: { _id: -1 }
        // }
        const result = await repositoriesCollection.findOne(query);
        // console.log(result)
        res.send(result);
  
      });

    //get all repositories
    app.get('/repositories', async (req, res) => {
      const result = await repositoriesCollection.find().toArray();
      res.send(result);
    })

    // get user repositories by user's email
    app.get("/myRepositories/:email", async (req, res) => {
        const email = req?.params?.email;
        const query = { email: email }
        // const options = {
        //   sort: { _id: -1 }
        // }
        const result = await repositoriesCollection.find(query).toArray();
        res.send(result);
  
      });


    // Create a new code snippet
    app.post("/snippets", async (req, res) => {
      const newSnippet = req.body;
      // console.log(newSnippet);
      const result = await snippetsCollection.insertOne(newSnippet);
      res.send(result);
    });

    // Get all code snippets
    app.get('/snippets', async (req, res) => {
      const result = await snippetsCollection.find().toArray();
      res.send(result);
    })



    app.get('/snippets/:id',  async (req, res) => {
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



    // Live chat apis (New Feature)

    // const Message = mongoose.model('Message', { text: String, sender: String, timestamp: Date });

    // app.post('/user/sendMessage', async (req, res) => {
    //   const { text } = req.body;
    //   const newMessage = new Message({ text, sender: 'admin', timestamp: new Date() });

    //   try {
    //     await newMessage.save();

    //     // Simulate a delay before sending the auto-reply
    //     setTimeout(async () => {
    //       const autoReply = new Message({
    //         text: 'Thank you for your message! An admin will get back to you shortly.',
    //         sender: 'admin',
    //         timestamp: new Date(),
    //       });
    //       await autoReply.save();

    //       res.status(200).json({ message: 'Message sent successfully.' });
    //     }, 1000); // Adjust the delay as needed
    //   } catch (error) {
    //     res.status(500).json({ error: 'An error occurred while sending the message.' });
    //   }
    // });

    // app.get('/user/getMessages', async (req, res) => {
    //   try {
    //     const messages = await Message.find();
    //     res.status(200).json({ messages });
    //   } catch (error) {
    //     res.status(500).json({ error: 'An error occurred while fetching messages.' });
    //   }
    // });






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // user profile update
app.get('/profile/:id', async (req, res) => {
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await updateProfileCollection.findOne(query);
  res.send(result);
})

app.post('/profile', async (req, res) => {
  const newProfile = req.body;
  console.log(newProfile);
  const result = await updateProfileCollection.insertOne(newProfile);
  res.send(result);
})

app.put('/updateProfile/:email', async (req, res) => {
  const email = req.params.email;
  const filter = { email: email }
  const options = { upsert: true };
  const updateProfile = req.body;
  const profile = {
    $set: {
      name: updateProfile.name,
      quantity: updateProfile.email,
      supplier: updateProfile.number,
      photo: updateProfile.photo,
    }

  }
  const result = await usersCollection.updateOne(filter, profile, options);
  res.send(result);

  
})
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




