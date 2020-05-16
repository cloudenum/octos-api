const joi = require('@hapi/joi')

module.exports = {
    async index(req, res) {
        try {
            const schema = joi.object({
                '0': joi.string(),
                '1': joi.string(),
                email: joi.string().email().required(),
                password: joi.string().required(),
                agent: joi.string(),
                user: joi.string()
            })

            const { value, error } = schema.validate(req.allParams())
            const { email, password } = value

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            if (req.param('agent')) {
                const agent = await Agent.findOne({ email: email })
                if (!agent) return res.badRequest('Email or password does\'t match')
                if (! await sails.helpers.compareHash(password, agent.password)) {
                    return res.badRequest('Email or password does\'t match')
                }

                return res.api(200, 'success', { token: JWTService.issuer({ agentId: agent.id }, '1 day') })
            } else if (req.param('user')) {
                const user = await User.findOne({ email: email })
                if (!user) return res.badRequest('Email or password does\'t match')

                if (! await sails.helpers.compareHash(password, user.password)) {
                    return res.badRequest('Email or password does\'t match')
                }

                return res.api(200, 'success', { token: JWTService.issuer({ userId: user.id }, '1 day') })
            }

            return res.badRequest()
        } catch (err) {
            if (err.name === 'UsageError') {
                sails.log.debug(err.message)
                return res.badRequest('Invalid value.')
            }

            if (err.name === 'AdapterError') {
                sails.log.debug(err.message)
                return res.serverError('Database error.')
            }

            sails.log.error(err.stack)
            throw err
        }
    },

    async refreshToken(req, res) {
        try {
            const schema = joi.object({
                authorization: joi.string().token().required()
            })

            const { value, error } = schema.validate(req.headers)

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            const JWTPayload = JWTService.verify(value.authorization)
            if (JWTPayload.userId) {
                const user = await User.findOne({ id: JWTPayload.userId })
                if (!user) return res.badRequest('failed')

                return res.api(200, 'success', { token: JWTService.issuer({ userId: user.id }, '1 day') })
            } else if (JWTPayload.agentId) {
                const agent = await Agent.findOne({ id: JWTPayload.agentId })
                if (!agent) return res.badRequest('failed')

                return res.api(200, 'success', { token: JWTService.issuer({ agentId: agent.id }, '1 day') })
            }

            return res.badRequest()
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
}