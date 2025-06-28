const http = require('http');
const https = require('https');
const chalk = require('chalk');
const zlib = require('zlib');

const BASE_URL = 'http://localhost:3001';

const files = [
  '/static/js/main.0d58a613.js',
  '/static/css/main.f855e6bc.css',
  '/index.html'
];

async function makeRequest(url, encoding) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'Accept-Encoding': encoding
      }
    };
    
    console.log(`Testando ${url} com Accept-Encoding: ${encoding}`);
    
    const req = client.get(url, options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer,
          size: buffer.length
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function runTests() {
  console.log(chalk.blue('=== Teste de Compressão do Servidor ==='));
  
  try {
    try {
      await makeRequest(`${BASE_URL}/api/health`, '');
      console.log(chalk.green('✓ Servidor está online'));
    } catch (err) {
      console.error(chalk.red(`✗ Servidor não está respondendo: ${err.message}`));
      console.error(chalk.yellow('Inicie o servidor antes de executar este teste'));
      return;
    }
    
    for (const file of files) {
      const url = `${BASE_URL}${file}`;
      console.log(chalk.yellow(`\nTestando arquivo: ${file}`));

      const noCompression = await makeRequest(url, 'identity');
      
      const gzipResponse = await makeRequest(url, 'gzip');
      
      const brotliResponse = await makeRequest(url, 'br');
      
      console.log('Tamanho sem compressão:', formatSize(noCompression.size));
      
      if (gzipResponse.headers['content-encoding'] === 'gzip') {
        const ratio = (100 - (gzipResponse.size / noCompression.size * 100)).toFixed(2);
        console.log(chalk.green(`Tamanho com gzip: ${formatSize(gzipResponse.size)} (${ratio}% menor)`));
      } else {
        console.log(chalk.yellow('Compressão gzip não foi aplicada'));
      }
      
      if (brotliResponse.headers['content-encoding'] === 'br') {
        const ratio = (100 - (brotliResponse.size / noCompression.size * 100)).toFixed(2);
        console.log(chalk.green(`Tamanho com brotli: ${formatSize(brotliResponse.size)} (${ratio}% menor)`));
      } else {
        console.log(chalk.yellow('Compressão brotli não foi aplicada'));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Erro durante o teste: ${error.message}`));
  }
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

runTests();
