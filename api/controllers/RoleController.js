const joi = require('@hapi/joi')
const { JSONError, JSONValidate } = require('../../lib/JSONValidate')
const projections = [
    'id',
    'name',
    'perms',
    'isAdmin',
]

module.exports = {
    create: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'RoleController', 'create')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            const schema = joi.object({
                name: joi.string().required().min(3),
                perms: joi.string().required(),
                isAdmin: joi.bool().required()
            })

            const { value, error } = schema.validate(req.allParams())
            const { name, perms, isAdmin } = value
            const permsObject = JSONValidate.validate(perms)

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            let role = await Role.create({
                name,
                isAdmin,
                perms: permsObject
            }).fetch()

            return res.api(200, 'success', role)
        } catch (err) {
            if (err instanceof JSONError) {
                return res.badRequest('Perms parameter is not a valid JSON')
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

    find: async (req, res) => {
        if (!await PermsService.isAllowed(req, 'RoleController', 'find')) {
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

            let role = await Role.find({
                select: projections,
                limit: value.limit,
                skip: value.limit * pagination,
                sort: `${value.sort} ${value.sortDir}`,
            })

            if (!role) {
                return res.notFound()
            }

            return res.api(200, 'success', role)
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
        if (!await PermsService.isAllowed(req, 'RoleController', 'findOne')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            let role = await Role.findOne({
                select: projections,
                where: { id: req.params.id },
            })

            if (!role) {
                return res.notFound(`Role with id ${req.params.id} can\'t be found`)
            }

            return res.api(200, 'success', role)
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
        if (!await PermsService.isAllowed(req, 'RoleController', 'update')) {
            return res.forbidden('You\'re not allowed.')
        }

        if (Object.keys(req.allParams()).length <= 1) {
            return res.badRequest('No data given.')
        }

        try {
            const schema = joi.object({
                id: joi.string().hex(),
                name: joi.string().min(3),
                perms: joi.string(),
                isAdmin: joi.bool()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            if (value.perms) {
                value.perms = JSONValidate.validate(value.perms)
            }

            const data = await ObjectService.deleteProperties(value, ['id'])

            let update = await Role.updateOne({ where: { id: value.id } })
                .set(data)

            if (!update) {
                return res.api(200, 'failed', null)
            }

            return res.api(200, 'success', update)
        } catch (err) {
            if (err instanceof JSONError) {
                return res.badRequest('Perms parameter is not a valid JSON')
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
        if (!await PermsService.isAllowed(req, 'RoleController', 'delete')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            let deletedRole = await Role.destroyOne({
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