const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion } = require('mongodb');

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hrk37.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unAuthorized access" })
    }
    const token = authHeader.split(" ")[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {

        if (err) {
            return res.status(403).send({ message: "forbidden access" })
        }
        req.decoded = decoded;
        next()
    });
}

async function run() {
    try {
        await client.connect()
        const toolsCollection = client.db("motor-bike-parts").collection("tools");
        const userCollection = client.db('motor-bike-parts').collection('users');
        const orderCollection = client.db('motor-bike-parts').collection('order')
        const reviewCollection = client.db('motor-bike-parts').collection('review')
        const paymentCollection = client.db('motor-bike-parts').collection('payments')
        console.log("connected");



        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email
            const requesterAccount = await userCollection.findOne({ email: requester })

            if (requesterAccount.role === 'admin') {
                next()
            }
            else {
                res.status(403).send({ message: "forbidden" });
            }
        }


        // get all products

        app.get('/productCount', async (req, res) => {
            const count = await toolsCollection.estimatedDocumentCount();
            res.send({ count })
        });

        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = toolsCollection.find(query);

            let products;
            if (page || size) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }

            res.send(products)
        });

        //post products
        app.post('/products', verifyJWT, async (req, res) => {
            const product = req.body
            const result = await toolsCollection.insertOne(product)
            res.send(result);
        });

        //delete product
        app.delete('/products/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await toolsCollection.deleteOne(filter)
            res.send(result)
        });

        // Update quantity
        app.put('/products/:id', async (req, res) => {
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
            const result = await toolsCollection.updateOne(filter, updatePro, option);
            res.send(result)
        });

        // Update Product
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const product = req.body;
            console.log(product);
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatePro = {
                $set: product
            }
            const result = await toolsCollection.updateOne(filter, updatePro, option);
            res.send(result)
        });

        //get specefic product
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolsCollection.findOne(query);
            res.send(tool)
        });

        //send user information mongodb

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

        // all users
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        });

        //make user as admin
        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' },
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send({ result })
        });

        // update user
        app.put('/userinfo/:email', verifyJWT, async (req, res) => {
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

        // user role
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user.role === 'admin'
            res.send({ admin: isAdmin })
        });

        //deleted user 
        app.delete('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
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
        app.get('/orders/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const result = await orderCollection.find({ email }).toArray()
            res.send(result)
        });

        // get specefic order
        app.get('/specificorders/:id', verifyJWT, async (req, res) => {
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
        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(filter)
            res.send(result)
        });

        // post review
        app.post('/review', verifyJWT, async (req, res) => {
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
        app.delete('/review/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(filter)
            res.send(result)
        });

        // send payment into database
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
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

        app.patch("/orders/:id", verifyJWT, async (req, res) => {
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

        //change order after paymet and give shifrting
        app.patch("/shiftorders/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    shift: true
                }
            }
            const updateOrders = await orderCollection.updateOne(filter, updateDoc)

            res.send(updateOrders)
        });

    }
    finally {

    }
}


run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Moto World is running')
});

app.listen(port, () => {
    console.log(`port is running on`, port)
});