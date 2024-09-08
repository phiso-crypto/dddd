const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { request } = require('undici');
const HttpsProxyAgent = require('https-proxy-agent');

// Proxy listesi dosyasının yolu
const proxyFile = 'proxylist.txt';

// Eğer ana thread'deysek, işçileri (workers) başlat
if (isMainThread) {
  fs.readFile(proxyFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Proxy dosyası okunamadı:', err);
      return;
    }

    // Proxy listesini satırlara ayır
    const proxies = data.split('\n').map(line => line.trim()).filter(Boolean);

    // 1000 işçi başlatmak için
    for (let i = 0; i < 1000; i++) {
      const proxy = proxies[i % proxies.length];  // Proxy rotasyonu
      const worker = new Worker(__filename, { workerData: proxy });  // Her proxy için işçi başlat
      worker.on('message', msg => console.log(msg));
      worker.on('error', err => console.error(err));
    }
  });
} else {
  // İşçi thread'inde isek proxy ile HTTP isteği gönder
  const proxy = workerData;

  const agent = new HttpsProxyAgent(`http://${proxy}`);

  // İstek gönderen fonksiyon
  const sendRequest = async () => {
    try {
      const { statusCode } = await request('https://phiso.online', {
        dispatcher: agent,  // undici ile proxy kullanımı
      });
      parentPort.postMessage(`Proxy ${proxy} ile istek başarılı: ${statusCode}`);
    } catch (error) {
      parentPort.postMessage(`Proxy ${proxy} ile istek başarısız: ${error.message}`);
    }
  };

  sendRequest();
}
