const http = require('http');
const port = 80;

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello from CI/CD demo on Azure!');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
