const fs = require('fs');
const path = require('path');
const { setupLogger } = require('../config/logger');

function ms(val) {
  const s = 1000;
  const m = s * 60;
  const h = m * 60;
  const d = h * 24;
  const w = d * 7;
  
  if (typeof val === 'string') {
    if (/^\d+$/.test(val)) {
      return parseInt(val, 10);
    }
    
    val = val.toLowerCase();
    
    if (/^(\d+)s$/.test(val)) {
      return parseInt(RegExp.$1, 10) * s;
    }
    if (/^(\d+)m$/.test(val)) {
      return parseInt(RegExp.$1, 10) * m;
    }
    if (/^(\d+)h$/.test(val)) {
      return parseInt(RegExp.$1, 10) * h;
    }
    if (/^(\d+)d$/.test(val)) {
      return parseInt(RegExp.$1, 10) * d;
    }
    if (/^(\d+)w$/.test(val)) {
      return parseInt(RegExp.$1, 10) * w;
    }
  }
  
  return val;
}

const logger = setupLogger();

const serveCompressedStatic = (options = {}) => {
  const staticRoot = options.root || path.join(process.cwd(), 'public');
  
  const compressibleExtensions = options.extensions || ['.html', '.js', '.css', '.svg', '.json'];
  
  const fileExistsCache = new Map();
  
  const CACHE_EXPIRY = 5 * 60 * 1000;
  
  const fileExistsCached = (filePath) => {
    const now = Date.now();
    
    if (fileExistsCache.has(filePath)) {
      const cacheEntry = fileExistsCache.get(filePath);
      
      if (now - cacheEntry.timestamp < CACHE_EXPIRY) {
        return cacheEntry.exists;
      }
    }
    
    try {
      const exists = fs.existsSync(filePath);
      fileExistsCache.set(filePath, { exists, timestamp: now });
      return exists;
    } catch (err) {
      logger.error(`Erro ao verificar arquivo ${filePath}:`, err);
      return false;
    }
  };
  
  return (req, res, next) => {
    const ext = path.extname(req.path);
    if (!compressibleExtensions.includes(ext)) {
      return next();
    }
    
    const filePath = path.join(staticRoot, req.path);
    
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (!fileExistsCached(filePath)) {
      return next();
    }
    
    const maxAge = process.env.NODE_ENV === 'production' ? '7d' : '0';
    res.setHeader('Cache-Control', `public, max-age=${maxAge === '0' ? '0' : Math.floor(ms(maxAge) / 1000)}`);
    
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Content-Type', getContentType(ext));
    
    if (/\bbr\b/.test(acceptEncoding)) {
      const brPath = `${filePath}.br`;
      
      if (fileExistsCached(brPath)) {
        res.setHeader('Content-Encoding', 'br');
        
        if (process.env.NODE_ENV !== 'production') {
          const originalSize = fs.statSync(filePath).size;
          const compressedSize = fs.statSync(brPath).size;
          const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
          logger.debug(`BR: ${req.path} - Original: ${originalSize} bytes, Comprimido: ${compressedSize} bytes (${savings}% economia)`);
        } else {
          logger.info(`Servindo arquivo comprimido (BR): ${req.path}`);
        }
        
        fs.createReadStream(brPath)
          .on('error', (err) => {
            logger.error(`Erro ao servir arquivo comprimido BR ${brPath}:`, err);
            next();
          })
          .pipe(res);
        return;
      }
    }
    
    if (/\bgzip\b/.test(acceptEncoding)) {
      const gzipPath = `${filePath}.gz`;
      
      if (fileExistsCached(gzipPath)) {
        res.setHeader('Content-Encoding', 'gzip');
        
        if (process.env.NODE_ENV !== 'production') {
          const originalSize = fs.statSync(filePath).size;
          const compressedSize = fs.statSync(gzipPath).size;
          const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
          logger.debug(`GZIP: ${req.path} - Original: ${originalSize} bytes, Comprimido: ${compressedSize} bytes (${savings}% economia)`);
        } else {
          logger.info(`Servindo arquivo comprimido (GZIP): ${req.path}`);
        }
        
        fs.createReadStream(gzipPath)
          .on('error', (err) => {
            logger.error(`Erro ao servir arquivo comprimido GZIP ${gzipPath}:`, err);
            next();
          })
          .pipe(res);
        return;
      }
    }
    
    next();
  };
};

function getContentType(ext) {
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

module.exports = serveCompressedStatic;
