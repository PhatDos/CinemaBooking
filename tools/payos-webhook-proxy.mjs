import http from 'node:http';

const listenPort = 18081;
const targetWebhookUrl = 'http://127.0.0.1:8081/api/payments/webhooks/payos';

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('Healthy');
      return;
    }

    if (req.method !== 'POST' || url.pathname !== '/api/payments/webhooks/payos') {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks);
    const upstream = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'] ?? 'application/json',
      },
      body,
    });
    const upstreamBody = Buffer.from(await upstream.arrayBuffer());

    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    });
    res.end(upstreamBody);
  } catch {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Webhook proxy error');
  }
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`PayOS webhook proxy listening on http://127.0.0.1:${listenPort}`);
  console.log(`Forwarding POST /api/payments/webhooks/payos to ${targetWebhookUrl}`);
});
