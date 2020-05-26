module.exports = {
    attributes: {
        phone: {
            type: 'string',
            required: true,
        },
        countryCode: {
            type: 'number',
            required: true
        },
        poolIndex: {
            type: 'number'
        },
        isActive: {
            type: 'boolean'
        },
        user: {
            model: 'user',
            columnName: 'userId'
        },

        subscribedAgents: {
            collection: 'agent',
            via: 'subscribedPhoneNumber'
        }
    }
}