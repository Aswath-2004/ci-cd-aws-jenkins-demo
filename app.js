// app.js
//test update-final1
const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;

app.get('/', (req, res) => res.send('Hello from CI/CD demo of Aswath Pranav Balan on Azure v2!'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));