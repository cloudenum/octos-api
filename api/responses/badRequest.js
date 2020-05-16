module.exports = function badRequest(message = '') {
    return this.res.api(400, message, null);
}