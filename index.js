const express = require("express");
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, Collection } = require('mongodb');
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
        const collection = client.db("test").collection("devices");
        client.close();

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