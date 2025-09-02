import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
    transpilePackages: ['next-mdx-remote'],
    images: {
        remotePatterns: [
            { hostname: 'www.google.com' },
            { hostname: 'img.clerk.com' },
            { hostname: 'zyqdiwxgffuy8ymd.public.blob.vercel-storage.com' },
        ],
    },

    experimental: {
        externalDir: true,
    },
    webpack: (config, options) => {
        if (!options.isServer) {
            config.resolve.fallback = { fs: false, module: false, path: false };
            
            // Add externals for gRPC dependencies to prevent client-side bundling
            config.externals = config.externals || [];
            config.externals.push({
                '@google-cloud/vision': 'commonjs @google-cloud/vision',
                '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
                'google-gax': 'commonjs google-gax',
                'tesseract.js': 'commonjs tesseract.js',
                // Prevent Node.js modules from being bundled for client
                'tls': 'commonjs tls',
                'net': 'commonjs net',
                'http2': 'commonjs http2',
                'fs': 'commonjs fs',
                'path': 'commonjs path',
                'child_process': 'commonjs child_process',
            });
        }
        
        // Experimental features
        config.experiments = {
            ...config.experiments,
            topLevelAwait: true,
            layers: true,
        };

        return config;
    },
    async redirects() {
        return [{ source: '/', destination: '/chat', permanent: true }];
    },
};

export default withSentryConfig(nextConfig, {
    // Sentry configuration (unchanged)
    org: 'saascollect',
    project: 'javascript-nextjs',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
});
