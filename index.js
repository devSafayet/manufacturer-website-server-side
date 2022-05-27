const express = require("express");
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();


app.get('/', (req, res) => {
    res.send('Server mama cholteche')
});

app.listen(port, () => {
    console.log('server runnig', port)
});