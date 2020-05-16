module.exports = {
    attributes: {
        name: {
            type: 'string',
            required: true,
        },
        address: {
            type: 'string',
            required: true,
        },
        contact: {
            type: 'string',
        },

        users: {
            collection: 'user',
            via: 'company'
        },
        agents: {
            collection: 'agent',
            via: 'company'
        }
    }
}