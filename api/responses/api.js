module.exports = function api(code, messages, data) {
    this.res.status(code);
    if (!Array.isArray(messages)) {
        return this.res.json({ messages: [messages], data: data, })
    }
    return this.res.json({ messages: messages, data: data, })
}