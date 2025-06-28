const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); 

const buildDir = path.resolve(__dirname, '../build');
const staticDir = path.resolve(buildDir, 'static');

function calculateDirSize(dirPath) {
  let totalSize = 0;
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      totalSize += calculateDirSize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }
  
  return totalSize;
}

function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function analyzeCompressedFiles() {
  console.log(chalk.blue('=== Análise de Compressão de Bundle ==='));
  
  try {
    if (!fs.existsSync(buildDir)) {
      console.log(chalk.red('Diretório de build não encontrado. Execute primeiro `npm run build`.'));
      return;
    }
    
    const totalBuildSize = calculateDirSize(buildDir);
    console.log(chalk.green(`Tamanho total do build: ${formatFileSize(totalBuildSize)}`));
    
    const jsDir = path.join(staticDir, 'js');
    if (fs.existsSync(jsDir)) {
      analyzeDirectory(jsDir, '.js');
    }
    
    const cssDir = path.join(staticDir, 'css');
    if (fs.existsSync(cssDir)) {
      analyzeDirectory(cssDir, '.css');
    }
  } catch (error) {
    console.error(chalk.red(`Erro durante a análise: ${error.message}`));
  }
}

function analyzeDirectory(dirPath, extension) {
  console.log(chalk.yellow(`\nAnalisando arquivos ${extension}:`));
  
  try {
    const files = fs.readdirSync(dirPath);
    
    const regularFiles = files.filter(file => 
      file.endsWith(extension) && 
      !file.endsWith('.map') && 
      !file.endsWith('.gz') && 
      !file.endsWith('.br')
    );
    
    for (const file of regularFiles) {
      const filePath = path.join(dirPath, file);
      const fileSize = fs.statSync(filePath).size;
      
      console.log(chalk.white(`\nArquivo: ${file}`));
      console.log(`Tamanho original: ${formatFileSize(fileSize)}`);
      
      const gzipPath = `${filePath}.gz`;
      if (fs.existsSync(gzipPath)) {
        const gzipSize = fs.statSync(gzipPath).size;
        const savingPercent = ((fileSize - gzipSize) / fileSize * 100).toFixed(2);
        console.log(chalk.green(`Tamanho gzip: ${formatFileSize(gzipSize)} (${savingPercent}% menor)`));
      } else {
        console.log(chalk.yellow('Versão gzip não encontrada'));
      }
      
      const brPath = `${filePath}.br`;
      if (fs.existsSync(brPath)) {
        const brSize = fs.statSync(brPath).size;
        const savingPercent = ((fileSize - brSize) / fileSize * 100).toFixed(2);
        console.log(chalk.green(`Tamanho brotli: ${formatFileSize(brSize)} (${savingPercent}% menor)`));
      } else {
        console.log(chalk.yellow('Versão brotli não encontrada'));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Erro ao analisar diretório ${dirPath}: ${error.message}`));
  }
}

analyzeCompressedFiles();
