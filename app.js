// app.js
//test update-final 3Nov
const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;

app.get('/', (req, res) => res.send('Hello from CI/CD demo of Aswath Pranav Balan T of IoT A 22011102009 on Azure v3!'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));