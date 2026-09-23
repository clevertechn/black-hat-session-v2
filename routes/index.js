let qrRoute;
let pairRoute;
let qrRouteError = null;
let pairRouteError = null;

try {
    qrRoute = require('./qr');
} catch (error) {
    console.error('QR route failed to load:', error.message);
    qrRouteError = error.message;
}

try {
    pairRoute = require('./pair');
} catch (error) {
    console.error('Pair route failed to load:', error.message);
    pairRouteError = error.message;
}

module.exports = { qrRoute, pairRoute, qrRouteError, pairRouteError };
