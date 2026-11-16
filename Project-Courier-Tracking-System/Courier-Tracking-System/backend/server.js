const express = require('express');
const cors = require('cors');


const app = express();
const shipmentRoutes = require('./routes/shipmentRoutes');

app.use(cors());
app.use(express.json());

require('./config/db');

app.use('/api/shipments', shipmentRoutes);


app.get('/', (req, res) => {
    res.send('Courier Tracking System API is running!');
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});