const jwt = require('jsonwebtoken')
const key = sails.config.session.secret

module.exports = {
    issuer(payload, expiresIn) {
        return jwt.sign(payload, key, { expiresIn })
    },

    verify(token) {
        return jwt.verify(token, key)
    },
}