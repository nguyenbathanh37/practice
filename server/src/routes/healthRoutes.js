// src/routes/healthRoutes.js
module.exports = (api) => {
    api.get('/health', async (req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Service is up and running 🚀',
        });
    });

    return api;
};
