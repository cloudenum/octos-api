module.exports = function forbidden(message = '') {
    return this.res.api(403, message, null);
}