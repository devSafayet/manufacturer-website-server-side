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
        const toolsCollection = client.db("motor-bike-tools").collection("services");



        // get all products

        app.get('/servicesCount', async (req, res) => {
            const count = await toolsCollection.estimatedDocumentCount();
            res.send({ count })
        });
        app.get('/services', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {}
            const cursor = toolsCollection.find(query);

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
            const result = await toolsCollection.insertOne(service)
            res.send(result);
        });

        //delete tools services
        app.delete('/services/:id', verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await toolsCollection.deleteOne(filter)
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
        });
        //get specification product
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const biketool = await bikeToolsCollection.findOne(query);
            res.send(biketool)
        })

        //send user information in to mongodb

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET)
            res.send({ result, token })
        });
        // All users
        app.get('/users', async (req, res) => {

            const result = await userCollection.find().toArray()
            res.send(result)
        });

        //Make users admin
        app.put('/user/admin/:email', verifyAdmin, async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' },
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send({ result })

        });
        // update user
        app.put('/userinfo/:email', async (req, res) => {
            const email = req.params.email
            const img = req.body
            console.log(img, email);
            const filter = { email: email }
            const updateDoc = {
                $set: { img: img },
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send({ result })

        });
        // get user by its role
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user.role === 'admin'
            res.send({ admin: isAdmin })
        });

        //deleted user 
        app.delete('/user/admin/:email', verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const result = await userCollection.deleteOne(filter)
            res.send(result)
        });
        //post booking order in to database
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await orderCollection.insertOne(orders);
            res.send(result)
        });


        //get user all orders
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email
            const result = await orderCollection.find({ email }).toArray()
            res.send(result)
        });
        // get specific order
        app.get('/specificorders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order)
        });
        //get all orders
        app.get('/allorders', async (req, res) => {

            const result = await orderCollection.find({}).toArray()
            res.send(result)
        });

        // delete orders 
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(filter)
            res.send(result)
        });

        // post review
        app.post('/review', async (req, res) => {
            const product = req.body
            const result = await reviewCollection.insertOne(product)
            res.send(result);
        });
        //get all review
        app.get('/getreviews', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        });

        //delete review
        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(filter)
            res.send(result)
        });

        // send payment into database

        app.post('/create-payment-intent', async (req, res) => {
            const price = req.body.price;
            const amount = price * 100;
            if (amount !== 0) {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd',
                    payment_method_types: ['card']
                });
                res.send({
                    clientSecret: paymentIntent.client_secret,
                })
            }
        });
        //store payment and update order information

        app.patch("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionID
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updateOrders = await orderCollection.updateOne(filter, updateDoc)


            res.send(updateOrders)
        });


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