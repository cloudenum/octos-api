const { JSONError } = require('./JSONError')

module.exports.JSONValidate = {
    validate: (string) => {
        try {
            return JSON.parse(string)
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new JSONError('String is not a valid JSON.')
            }

            throw error
        }
    }
}