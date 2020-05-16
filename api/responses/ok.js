module.exports = function ok(message = 'OK') {
    return this.res.api(200, message, null);
}