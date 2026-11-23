import { createRecognitionHttpServer } from './http-app.js';
import { createProvider } from './index.js';

const port = Number(process.env['PORT'] ?? 4318);
const host = process.env['HOST'] ?? '127.0.0.1';
const server = createRecognitionHttpServer({
  apiKey: process.env['UAMR_API_KEY'],
  provider: createProvider(),
});

server.listen(port, host, () => {
  console.log(`Universal AI Music Recognition API listening on http://${host}:${port}`);
});
