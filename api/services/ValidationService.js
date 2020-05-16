module.exports = {
    async isEmptyPayload(req) {
        if (req.allParams()) return false

        return true
    },

    async extractPayload(req) {
        if (!this.isEmptyPayload(req)) {
            return req.allParams()
        }
    },

    produceMessages(errDetails) {
        let messages = []

        errDetails.forEach(detail => {
            messages.push(detail.message)
        });

        return messages
    }
}