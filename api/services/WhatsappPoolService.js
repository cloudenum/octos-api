class WhatsappPool {
    pool = []

    append(whatsappInstance) {
        return this.pool.push(whatsappInstance) - 1
    }

    remove(index) {
        return this.pool.splice(index, 1)
    }

    drain() {
        this.pool = []
    }
}

module.exports = {
    WhatsappPool: new WhatsappPool(),
}