module.exports = function notFound(message = 'The URL can\'t be found.') {
    return this.res.api(404, message, null)
}