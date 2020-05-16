const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = require('jsonwebtoken')
const JWTService = require('../services/JWTService')

module.exports = async (req, res, proceed) => {
    if (!req.headers.authorization) {
        return res.forbidden('Authorization token required!')
    }

    try {
        const token = req.headers.authorization.substring(7).trim()
        const JWTPayload = JWTService.verify(token)

        if (JWTPayload.userId) {
            const user = await User.findOne({
                select: ['id'],
                where: { id: JWTPayload.userId }
            })

            if (!user) {
                return res.forbidden();
            }
        } else if (JWTPayload.agentId) {
            const agent = await Agent.findOne({
                select: ['id'],
                where: { id: JWTPayload.agentId }
            })

            if (!agent) {
                return res.forbidden();
            }
        } else {
            return res.forbidden()
        }

        return proceed();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            sails.log.info(err.message)
            return res.forbidden('Token has expired.')
        }

        if (err instanceof NotBeforeError) {
            sails.log.info(err.message)
            return res.forbidden('Token is not active.')
        }

        if (err instanceof JsonWebTokenError) {
            sails.log.info(err.message)
            return res.forbidden('Token is invalid.')
        }

        if (err.name === 'UsageError') {
            sails.log.debug(err.message)
            return res.forbidden()
        }

        if (err.name === 'AdapterError') {
            sails.log.debug(err.message)
            return res.forbidden()
        }

        sails.log.error(err.stack)
        throw err
    }
}