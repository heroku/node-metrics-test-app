#!/usr/bin/env node

const http = require('http');
const EventEmitter = require('events');

const PORT = process.env.PORT || 5000;
const Events = new EventEmitter();

// This will block the event loop for ~lengths of time
async function blockCpuFor(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`blocking the event loop for ${ms}ms`);
      let now = new Date().getTime();
      let result = 0
      while(true) {
        result += Math.random() * Math.random();
        if (new Date().getTime() > now + ms)
          break;
      }
      resolve();
    }, 100);
  });
}

async function getNextMetricsEvent() {
  return new Promise((resolve, reject) => Events.once('metrics', resolve));
}

const server = http.createServer(async (req, res) => {
  // wait for the next metrics event
  await getNextMetricsEvent();

  // block the event loop for bit
  await blockCpuFor(2000);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);
  await blockCpuFor(100);

  // gather the next metrics data which should include these pauses
  let data = await getNextMetricsEvent();

  res.setHeader('Content-Type', 'application/json');
  res.end(data);
});

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Create a second server that intercepts the HTTP requests
// sent by the metrics plugin
const metricsListener = http.createServer((req, res) => {
  if (req.method == 'POST') {
    let body = '';
    req.on('data', (data) => body += data);
    req.on('end', () => Events.emit('metrics', body));
    res.statusCode = 200;
    res.end();
  }
});

metricsListener.listen(3000, () => console.log('Listening for metrics on 3000'));

