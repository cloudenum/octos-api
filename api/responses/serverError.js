module.exports = function serverError(message) {
    return this.res.api(500, message, null)
}