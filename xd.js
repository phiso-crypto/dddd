const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { request } = require('undici');
const HttpsProxyAgent = require('https-proxy-agent');

// Proxy listesi dosyasının yolu
const proxyFile = 'proxylist.txt';

// Eğer ana thread'deysek, işçileri (workers) başlat
if (isMainThread) {
  console.log('Ana thread başlatıldı, proxy dosyası okunuyor...');
  
  fs.readFile(proxyFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Proxy dosyası okunamadı:', err);
      return;
    }

    // Proxy listesini satırlara ayır
    const proxies = data.split('\n').map(line => line.trim()).filter(Boolean);

    if (proxies.length === 0) {
      console.error('Proxy listesi boş veya geçersiz.');
      return;
    }

    console.log(`${proxies.length} proxy bulundu. İşçiler başlatılıyor...`);

    // 1000 işçi başlatmak için
    for (let i = 0; i < 1000; i++) {
      const proxy = proxies[i % proxies.length];  // Proxy rotasyonu
      console.log(`Proxy ${proxy} için işçi başlatılıyor (İşçi #${i + 1})...`);

      const worker = new Worker(__filename, { workerData: proxy });  // Her proxy için işçi başlat
      
      worker.on('message', msg => console.log(msg));  // İşçi başarı mesajı
      worker.on('error', err => console.error(`İşçi hatası (Proxy: ${proxy}):`, err));  // İşçi hatası
      worker.on('exit', code => {
        if (code !== 0) {
          console.error(`İşçi beklenmeyen bir şekilde sonlandı (Exit code: ${code}, Proxy: ${proxy})`);
        }
      });
    }
  });

} else {
  // İşçi thread'inde isek proxy ile HTTP isteği gönder
  const proxy = workerData;
  const agent = new HttpsProxyAgent(`http://${proxy}`);

  console.log(`İşçi ${proxy} için HTTP isteği gönderiliyor...`);

  // İstek gönderen fonksiyon
  const sendRequest = async () => {
    try {
      const { statusCode } = await request('https://phiso.online', {
        dispatcher: agent,  // undici ile proxy kullanımı
      });
      if (statusCode === 200) {
        parentPort.postMessage(`Proxy ${proxy} ile başarılı bağlantı! Durum kodu: ${statusCode}`);
      } else {
        parentPort.postMessage(`Proxy ${proxy} bağlandı fakat durum kodu: ${statusCode}`);
      }
    } catch (error) {
      parentPort.postMessage(`Proxy ${proxy} ile bağlantı kurulamadı: ${error.message}`);
    }
  };

  sendRequest();
}
