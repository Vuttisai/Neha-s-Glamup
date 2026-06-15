// Neha's GlamUp - Frontend Configuration
const CONFIG = {
    // Automatically use localhost in dev, and your Render backend URL in production
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://neha-s-glamup.onrender.com'
};
