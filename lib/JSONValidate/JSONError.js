module.exports.JSONError = class JSONError extends Error {
    name = 'JSONError'

    constructor(message = '') {
        super(message)
    }
}