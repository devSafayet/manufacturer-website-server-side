const express = require("express");
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3bymp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

/* client.connect(err => {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
}); */

async function run() {
    try {
        await client.connect()
        const bikeToolsCollection = client.db("motor-bike-tools").collection("services");



        // get all products

        app.get('/servicesCount', async (req, res) => {
            const count = await bikeToolsCollection.estimatedDocumentCount();
            res.send({ count })
        });
        app.get('/services', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {}
            const cursor = bikeToolsCollection.find(query);

            let services;

            if (page || size) {
                services = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                services = await cursor.toArray();
            }


            res.send(services)
        });
        //post tools services

        app.post('/services', async (req, res) => {
            const service = req.body
            const result = await bikeToolsCollection.insertOne(service)
            res.send(result);
        });

        //delete tools services
        app.delete('/services/:id', verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bikeToolsCollection.deleteOne(filter)
            res.send(result)
        });

        // Update quantity 
        app.put('/services/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const quantity = req.body.updatequantity;
            console.log(quantity);
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatePro = {
                $set: {
                    quantity
                }
            }
            const result = await bikeToolsCollection.updateOne(filter, updatePro, option);
            res.send(result)
        })



    }
    finally {

    }
}


app.get('/', (req, res) => {
    res.send('Server mama cholteche')
});

app.listen(port, () => {
    console.log('server runnig', port)
});