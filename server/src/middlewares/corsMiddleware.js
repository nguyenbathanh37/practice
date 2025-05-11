export const corsMiddleware = async (req, res, next) => {
    res.cors({
        origin: '*',
        credentials: false,
        headers: 'Content-Type, Authorization',
        methods: 'GET, POST, PUT, DELETE, OPTIONS'
    });

    if (req.method === 'OPTIONS') {
        res.status(200);
        return res.send();
    }

    return next();
}