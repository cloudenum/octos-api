const bcrypt = require('bcrypt')

module.exports = {
    friendlyName: 'Compare hash',
    description: 'Compare hash from data to hash using bcrypt',
    inputs: {
        data: {
            type: 'string',
            required: true
        },
        hash: {
            type: 'string',
            required: true
        },
    },

    fn: async (inputs, exits) => {
        return exits.success(await bcrypt.compare(inputs.data, inputs.hash))
    }
}