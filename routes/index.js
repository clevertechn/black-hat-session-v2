let qrRoute;
let pairRoute;

try {
    qrRoute = require('./qr');
} catch (error) {
    console.error('QR route failed to load:', error.message);
}

try {
    pairRoute = require('./pair');
} catch (error) {
    console.error('Pair route failed to load:', error.message);
}

module.exports = { qrRoute, pairRoute };
