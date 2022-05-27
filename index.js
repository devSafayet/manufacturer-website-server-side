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

        app.get('/services', async (req, res) => {
            const count = await bikeToolsCollection.estimatedDocumentCount();
            res.send({ count })
        });
        app.get('/services', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {}
            const cursor = bikeToolsCollection.find(query);

            let products;

            if (page || size) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }


            res.send(services)
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