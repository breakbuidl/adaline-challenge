export const config = {
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/filesystem',
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
    },
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173'
    }
};