const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  };
  
export const config = {
    api: {
        baseUrl: getBackendUrl(),
        endpoints: {
        filesystem: '/api/filesystem',
        }
    },
    socket: {
        url: getBackendUrl(),
        options: {
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        }
    }
};