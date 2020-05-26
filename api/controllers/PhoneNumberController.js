const joi = require('@hapi/joi')
const projections = [
    'id',
    'phone',
    'countryCode',
    'poolIndex',
    'isActive'
]
const { Whatsapp } = require('../services/WhatsappService')
const { WhatsappPool } = require('../services/WhatsappPoolService')

module.exports = {
    async create(req, res) {
        if (!await PermsService.isAllowed(req, 'PhoneNumberController', 'create')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            const schema = joi.object({
                phone: joi.number().min(100000000).integer().positive(),
                countryCode: joi.number().positive().max(999).integer().required(),
                user: joi.string().hex().required()
            })

            const { value, error } = schema.validate(req.allParams())
            const { phone, countryCode, user } = value
            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            let phoneNumber = await PhoneNumber.create({
                phone,
                countryCode,
                user,
                poolIndex: null,
                isActive: false
            }).fetch()

            return res.api(200, 'success', phoneNumber)
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

    async find(req, res) {
        if (!await PermsService.isAllowed(req, 'PhoneNumberController', 'find')) {
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

            let phoneNumber = await PhoneNumber.find({
                select: projections,
                limit: value.limit,
                skip: value.limit * pagination,
                sort: `${value.sort} ${value.sortDir}`,
            })

            if (!phoneNumber) {
                return res.notFound()
            }

            return res.api(200, 'success', phoneNumber)
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

    async findOne(req, res) {
        if (!await PermsService.isAllowed(req, 'PhoneNumberController', 'findOne')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            let phoneNumber = await PhoneNumber.findOne({
                select: projections,
                where: { id: req.params.id },
            }).populate('user')

            if (!phoneNumber) {
                return res.notFound(`Phone number with id ${req.params.id} can\'t be found`)
            }

            return res.api(200, 'success', phoneNumber)
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

    async update(req, res) {
        if (!await PermsService.isAllowed(req, 'PhoneNumberController', 'update')) {
            return res.forbidden('You\'re not allowed.')
        }

        if (Object.keys(req.allParams()).length <= 1) {
            return res.badRequest('No data given.')
        }

        try {
            const schema = joi.object({
                id: joi.string().hex(),
                phone: joi.number().min(100000000).integer().positive(),
                countryCode: joi.number().positive().max(999).integer()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            const data = await ObjectService.deleteProperties(value, ['id'])

            let update = await PhoneNumber.updateOne({ where: { id: value.id } })
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

    async delete(req, res) {
        if (!await PermsService.isAllowed(req, 'PhoneNumberController', 'delete')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            let deletedPhoneNumber = await PhoneNumber.destroyOne({
                where: { id: req.params.id }
            })

            if (!deletedPhoneNumber) {
                return res.api(200, 'failed', null)
            }

            return res.api(200, 'success', deletedPhoneNumber)
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

    async activate() {
        if (!await PermsService.isAllowed(req, 'PhoneNumberController', 'activate')) {
            return res.forbidden('You\'re not allowed.')
        }

        try {
            const schema = joi.object({
                phone: joi.number().min(100000000).integer().positive(),
                countryCode: joi.number().positive().max(999).integer()
            })

            const { value, error } = schema.validate(req.allParams())

            if (error instanceof joi.ValidationError) {
                return res.badRequest(ValidationService.produceMessages(error.details))
            }

            let phoneNumber = await PhoneNumber.findOne({
                select: projections,
                where: {
                    phone: value.phone,
                    countryCode: value.countryCode
                },
            }).populate('user')

            if (!phoneNumber) {
                return res.notFound(`Phone number (${value.phone}) can\'t be found`)
            }

            const wa = new Whatsapp(phoneNumber.phone)
            const index = WhatsappPool.append(wa)
            WhatsappPool.pool[index].start()

            const update = await PhoneNumber.updateOne({ where: { phone: value.id } })
                .set({
                    poolIndex: index,
                    isActive: true
                })

            if (!update) {
                await WhatsappPool.pool[index].stop()
                return res.api(200, 'failed', null)
            }

            return res.api(200, 'success', phoneNumber)
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