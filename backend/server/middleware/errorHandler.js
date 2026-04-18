export const notFoundHandler = (req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

export const globalErrorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);
    const status = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
