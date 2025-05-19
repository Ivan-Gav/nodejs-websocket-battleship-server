import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import dotenv from 'dotenv';

dotenv.config();

const HTTP_PORT = parseInt(process.env.HTTP_PORT || '8080', 10);

const httpServer = http.createServer(function (req, res) {
  const __dirname = path.resolve(path.dirname(''));
  const file_path =
    __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);
  fs.readFile(file_path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static http server on the ${HTTP_PORT} port!`);
});
