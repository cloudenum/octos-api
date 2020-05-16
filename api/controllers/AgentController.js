const joi = require('@hapi/joi')
const PermsService = require('../services/PermsService')
const projections = [
    'id',
    'fullname',
    'email',
    'role',
    'company',
    'manager',
    'subscribedPhoneNumber',
]

module.exports = {
    create: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'AgentController', 'create')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            const schema = joi.object({
                fullname: joi.string().min(3).required(),
                email: joi.string().email().required(),
                password: joi.string()
                    .min(8)
                    .pattern(/[a-z]+/, 'lowercase')
                    .pattern(/[A-Z]+/, 'uppercase')
                    .pattern(/[0-9]+/, 'numbers')
                    .pattern(/[\!\@\#\$\%\^\&\*\(\)\+\-\=\{\}\\\|\[\]\'\"\;\:\<\>\,\.\/\?\`\~]+/, 'symbols')
                    .required(),
                manager: joi.string().hex().required(),
                subscribedPhoneNumber: joi.string().hex().default(null),
                company: joi.string().hex().required()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            const encryptedPassword = await sails.helpers.createHash(value.password)

            const agentRole = await Role.findOne({
                select: ['id'],
                where: { name: 'agent' }
            })

            let agent = await Agent.create({
                fullname: value.fullname,
                email: value.email,
                password: encryptedPassword,
                role: agentRole.id,
                company: value.company,
                manager: value.manager,
                subscribedPhoneNumber: value.subscribedPhoneNumber,
            }).fetch()

            agent = await ObjectService.deleteProperties(agent, ['password'])

            return res.api(200, 'success', agent)
        } catch (err) {
            if (err.code === 'E_UNIQUE') {
                return res.badRequest(err.message + '\nThis happens because email already exist.')
            }

            if (err.name === 'UsageError') {
                sails.log.info(err.message)
                return res.badRequest('Invalid value.')
            }

            if (err.name === 'AdapterError') {
                sails.log.debug(err.stack)
                return res.serverError('Database error.')
            }

            sails.log.error(err.stack)
            throw err
        }
    },

    find: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'AgentController', 'find')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            const schema = joi.object({
                sort: joi.string().default('id'),
                sortDir: joi.string().default('ASC'),
                pagination: joi.number().default(1),
                limit: joi.number().default(25)
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }
            const pagination = value.pagination > 0 ? value.pagination - 1 : 0
            let agent = {}

            const token = req.headers.authorization.substring(7).trim()
            const JWTPayload = JWTService.verify(token)
            if (JWTPayload.userId) {
                const user = await User.findOne({
                    select: ['id', 'role'],
                    where: { id: JWTPayload.userId }
                }).populate('role')

                if (user.role.isAdmin) {
                    agent = await Agent.find({
                        select: projections,
                        limit: value.limit,
                        skip: value.limit * pagination,
                        sort: `${value.sort} ${value.sortDir}`,
                    })
                        .populate('company')
                        .populate('subscribedPhoneNumber')
                        .populate('manager')
                } else {
                    agent = await Agent.find({
                        select: projections,
                        where: {
                            manager: user.id
                        },
                        limit: value.limit,
                        skip: value.limit * pagination,
                        sort: `${value.sort} ${value.sortDir}`,
                    })
                        .populate('company')
                        .populate('subscribedPhoneNumber')
                }
            }

            if (!agent) {
                return res.notFound()
            }

            return res.api(200, 'success', agent)
        } catch (err) {
            if (err.code === 'E_UNIQUE') {
                return res.badRequest(err.message + '\nThis happens because email already exist.')
            }

            if (err.name === 'UsageError') {
                sails.log.info(err.message)
                return res.badRequest('Invalid value.')
            }

            if (err.name === 'AdapterError') {
                sails.log.debug(err.stack)
                return res.serverError('Database error.')
            }

            sails.log.error(err.stack)
            throw err
        }
    },

    findOne: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'AgentController', 'findOne')) {
            return res.forbidden('You\'re not allowed.')
        }

        if ((await PermsService.getRole(req)).name === 'agent') {
            if (!await PermsService.onlyMe(req)) {
                return res.notFound()
            }
        }

        try {
            let agent = {}
            const token = req.headers.authorization.substring(7).trim()
            const JWTPayload = JWTService.verify(token)

            if (JWTPayload.userId) {
                const user = await User.findOne({
                    select: ['id', 'role'],
                    where: { id: JWTPayload.userId }
                }).populate('role')

                if (!user.role.isAdmin) {
                    agent = await Agent.findOne({
                        select: projections,
                        where: {
                            id: req.params.id,
                            manager: user.id
                        },
                    })
                        .populate('manager')
                        .populate('subscribedPhoneNumber')
                        .populate('company')

                    if (!agent) {
                        return res.notFound(`Agent with id ${req.params.id} can\'t be found`)
                    }

                    return res.api(200, 'success', agent)
                }
            }

            agent = await Agent.findOne({
                select: projections,
                where: { id: req.params.id },
            })
                .populate('manager')
                .populate('subscribedPhoneNumber')
                .populate('company')

            if (!agent) {
                return res.notFound(`Agent with id ${req.params.id} can\'t be found`)
            }

            return res.api(200, 'success', agent)
        } catch (err) {
            if (err.name === 'UsageError') {
                sails.log.info(err.message)
                return res.badRequest('Invalid value.')
            }

            if (err.name === 'AdapterError') {
                sails.log.debug(err.stack)
                return res.serverError('Database error.')
            }

            sails.log.error(err.stack)
            throw err
        }
    },

    update: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'AgentController', 'update')) {
            return res.forbidden('You\'re not allowed.')
        }

        if ((await PermsService.getRole(req)).name === 'agent') {
            if (!await PermsService.onlyMe(req)) {
                return res.notFound()
            }
        }

        if (Object.keys(req.allParams()).length <= 1) {
            return res.badRequest('No data given.')
        }

        try {
            const schema = joi.object({
                id: joi.string().hex(),
                manager: joi.string().hex(),
                subscribedPhoneNumber: joi.string().hex(),
                company: joi.string().hex()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            const data = await ObjectService.deleteProperties(value, ['id'])

            const update = await Agent.updateOne({
                where: { id: value.id }
            }).set(data)

            if (!update) {
                return res.api(200, 'failed', null)
            }

            const agent = await Agent.findOne({
                select: projections,
                where: { id: req.params.id },
            })
                .populate('user')
                .populate('subscribedPhoneNumber')


            return res.api(200, 'success', agent)
        } catch (err) {
            if (err.code === 'E_UNIQUE') {
                return res.badRequest(err.message + '\nThis happens because email already exist.')
            }

            if (err.name === 'UsageError') {
                sails.log.info(err.message)
                return res.badRequest('failed')
            }

            if (err.name === 'AdapterError') {
                sails.log.debug(err.stack)
                return res.serverError('Database error.')
            }

            sails.log.error(err.stack)
            throw err
        }
    },

    delete: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'AgentController', 'delete')) {
            return res.forbidden('You\'re not allowed.')
        }

        if ((await PermsService.getRole(req)).name === 'agent') {
            if (!await PermsService.onlyMe(req)) {
                return res.notFound()
            }
        }

        try {
            let deletedAgent = await Agent.destroyOne({
                where: { id: req.params.id }
            })

            return res.api(200, 'success', deletedAgent)
        } catch (err) {
            if (err.name === 'UsageError') {
                sails.log.info(err.message)
                return res.badRequest('Invalid value.')
            }

            if (err.name === 'AdapterError') {
                sails.log.debug(err.stack)
                return res.serverError('Database error.')
            }

            sails.log.error(err.stack)
            throw err
        }
    }
}