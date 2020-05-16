module.exports = {
    attributes: {
        name: {
            type: 'string',
            required: true,
            unique: true,
        },
        isAdmin: {
            type: 'boolean',
        },
        perms: {
            type: 'json',
            required: true,
        },

        users: {
            collection: 'user',
            via: 'role',
        },
        agents: {
            collection: 'agent',
            via: 'role'
        }
    }
}