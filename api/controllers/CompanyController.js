const joi = require('@hapi/joi')
const projections = [
    'id',
    'name',
    'address',
    'contact',
]

module.exports = {
    create: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'CompanyController', 'create')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            const schema = joi.object({
                name: joi.string().required().min(3),
                address: joi.string().required(),
                contact: joi.string().required()
            })

            const { value, error } = schema.validate(req.allParams())
            const { name, address, contact } = value

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            let company = await Company.create({
                name,
                address,
                contact
            }).fetch()

            return res.api(200, 'success', company)
        } catch (err) {
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

    find: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'CompanyController', 'find')) {
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

            let company = await Company.find({
                select: projections,
                limit: value.limit,
                skip: value.limit * pagination,
                sort: `${value.sort} ${value.sortDir}`,
            })

            if (!company) {
                return res.notFound()
            }

            return res.api(200, 'success', company)
        } catch (err) {
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

    findOne: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'CompanyController', 'findOne')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            let company = await Company.findOne({
                select: projections,
                where: { id: req.params.id },
            })

            if (!company) {
                return res.notFound(`Role with id ${req.params.id} can\'t be found`)
            }

            return res.api(200, 'success', company)
        } catch (err) {
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

    update: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'CompanyController', 'update')) {
            return res.forbidden('You\'re not allowed.')
        }

        if (Object.keys(req.allParams()).length <= 1) {
            return res.badRequest('No data given.')
        }

        try {
            const schema = joi.object({
                id: joi.string().hex(),
                name: joi.string().min(3),
                address: joi.string(),
                contact: joi.string()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            const data = await ObjectService.deleteProperties(value, ['id'])

            let update = await Company.updateOne({ where: { id: value.id } })
                .set(data)

            if (!update) {
                return res.api(200, 'failed', null)
            }

            return res.api(200, 'success', update)
        } catch (err) {
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
        if (!await PermsService.isAllowed(req, 'CompanyController', 'delete')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            let deletedRole = await Company.destroyOne({
                where: { id: req.params.id }
            })

            if (!deletedRole) {
                return res.api(200, 'failed', null)
            }

            return res.api(200, 'success', deletedRole)
        } catch (err) {
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
    }
}