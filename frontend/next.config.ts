import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    // Use environment variable for API URL, fallback to localhost for development
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`
      }
    ]
  },
  // Tăng timeout và connection settings để tránh socket hang up
  httpAgentOptions: {
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000, // 60 seconds timeout
    freeSocketTimeout: 30000, // 30 seconds
  },
  webpack: (config, { isServer }) => {
    // Add path alias support for webpack
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Resolve path alias
    const srcPath = path.resolve(__dirname, './src');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcPath,
    };
    
    // Ensure modules are resolved correctly
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules'];
    }
    
    // Add extensions for module resolution
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    }
    
    // Ensure proper module resolution
    config.resolve.fullySpecified = false;
    
    // Server-side: handle pdfjs-dist and other Node.js modules
    if (isServer) {
      // Externalize pdfjs-dist to avoid bundling issues
      // It will be loaded at runtime via require()
      if (Array.isArray(config.externals)) {
        config.externals.push('pdfjs-dist', 'pdfjs-dist/legacy/build/pdf.js', 'pdfjs-dist/build/pdf.js')
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals
        config.externals = (context, request, callback) => {
          if (request && (request.includes('pdfjs-dist'))) {
            return callback(null, `commonjs ${request}`)
          }
          return originalExternals(context, request, callback)
        }
      } else {
        config.externals = ['pdfjs-dist', 'pdfjs-dist/legacy/build/pdf.js', 'pdfjs-dist/build/pdf.js']
      }
    }
    
    // Client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
