const bcrypt = require('bcrypt')

module.exports = {
    friendlyName: 'Create hash',
    description: 'Generate hash from provided data using bcrypt',
    inputs: {
        data: {
            type: 'string',
            required: true
        }
    },

    fn: async (inputs, exits) => {
        return exits.success(await bcrypt.hash(inputs.data, bcrypt.genSaltSync()))
    }
}