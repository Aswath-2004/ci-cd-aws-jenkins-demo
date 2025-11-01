// app.js
//test update-1
const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;

app.get('/', (req, res) => res.send('Hello from CI/CD demo of Aswath on Azure v2!'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));