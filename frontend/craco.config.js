const CompressionPlugin = require('compression-webpack-plugin');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization.usedExports = true;
        
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192, 
            minRatio: 0.8, 
            deleteOriginalAssets: false
          }),
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            compressionOptions: { level: 11 },
            threshold: 8192,
            minRatio: 0.8,
            deleteOriginalAssets: false
          })
        );
        
        if (process.env.ANALYZE === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'server',
              analyzerPort: 8888,
              openAnalyzer: true
            })
          );
        }
        
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          automaticNameDelimiter: '~',
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
            }
          }
        };
      }      
      return webpackConfig;
    },
  },
  style: {
    postcss: {
      plugins: [
        require('cssnano')({
          preset: ['default', {
            discardComments: {
              removeAll: true
            },
            minifyFontValues: {
              removeQuotes: false
            },
            normalizeWhitespace: false
          }]
        })
      ]
    }
  },
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.+)$": "<rootDir>/src/$1"
      }
    }
  }
};
