const joi = require('@hapi/joi')
const projections = [
    'id',
    'fullname',
    'email',
    'role',
    'company'
]

module.exports = {
    create: async (req, res) => {
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
                company: joi.string().hex()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            const encryptedPassword = await sails.helpers.createHash(value.password)

            const defaultRole = await Role.findOne({ name: 'default' })

            let user = await User.create({
                fullname: value.fullname,
                email: value.email,
                password: encryptedPassword,
                role: defaultRole.id,
                company: value.company
            }).fetch()

            user = await ObjectService.deleteProperties(user, ['password'])

            return res.api(200, 'success', user)
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
        if (!await PermsService.isAllowed(req, 'UserController', 'find')) {
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
            let user = await User.find({
                select: projections,
                limit: value.limit,
                skip: value.limit * pagination,
                sort: `${value.sort} ${value.sortDir}`,
            })

            if (!user) {
                return res.notFound()
            }

            return res.api(200, 'success', user)
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
        if (!await PermsService.isAllowed(req, 'UserController', 'findOne')) {
            return res.forbidden('You\'re not allowed.')
        }

        if (!await PermsService.onlyMe(req)) {
            return res.notFound()
        }

        try {
            let user = await User.findOne({
                select: projections,
                where: { id: req.params.id },
            })
                .populate('role')
                .populate('company')
                .populate('phoneNumbers')
                .populate('agents')

            if (!user) {
                return res.notFound(`User with id ${req.params.id} can\'t be found`)
            }

            return res.api(200, 'success', user)
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
        if (!await PermsService.isAllowed(req, 'UserController', 'update')) {
            return res.forbidden('You\'re not allowed.')
        }

        if (!await PermsService.onlyMe(req)) {
            return res.notFound()
        }

        if (Object.keys(req.allParams()).length <= 1) {
            return res.badRequest('No data given.')
        }

        try {
            const schema = joi.object({
                id: joi.string().hex(),
                fullname: joi.string().min(3),
                email: joi.string().email(),
                password: joi.string()
                    .pattern(/[a-z]+/, 'lowercase')
                    .pattern(/[A-Z]+/, 'uppercase')
                    .pattern(/[0-9]+/, 'numbers')
                    .pattern(/[\!\@\#\$\%\^\&\*\(\)\+\-\=\{\}\\\|\[\]\'\"\;\:\<\>\,\.\/\?\`\~]+/, 'symbols'),
                role: joi.string().hex(),
                company: joi.string().hex()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            const data = await ObjectService.deleteProperties(value, ['id'])

            if (data.password) {
                data.password = await sails.helpers.createHash(data.password)
            }

            const update = await User.updateOne({
                where: { id: value.id }
            }).set(data)

            if (!update) {
                return res.api(200, 'failed', null)
            }

            const user = await User.findOne({
                select: projections,
                where: { id: req.params.id },
            })
                .populate('role')
                .populate('phoneNumbers')

            return res.api(200, 'success', user)
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
        if (!await PermsService.isAllowed(req, 'UserController', 'delete')) {
            return res.forbidden('You\'re not allowed.')
        }

        if (!await PermsService.onlyMe(req)) {
            return res.notFound()
        }

        try {
            let deletedUser = await User.destroyOne({
                where: { id: req.params.id }
            }).cascade()

            // if (!deletedUser) {
            //     return res.api(200, 'failed', null)
            // }

            return res.api(200, 'success', deletedUser)
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