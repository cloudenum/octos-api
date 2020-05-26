const { Client } = require('whatsapp-web.js')

module.exports = {
    Whatsapp: class Whatsapp {
        phoneNumber
        req

        socketRooms
        client = new Client({
            puppeteer: {
                ignoreDefaultArgs: ['--disable-extensions'],
                args: ['--no-sandbox']
            }
        })

        constructor(phoneNumber) {
            this.phoneNumber = phoneNumber

            this.client.on('qr', (qr) => {
                sails.log.info(qr)

                if (this.req.isSocket) {
                    sails.socket.join(sails.req, `${this.phoneNumber}PrivateRoom`)

                    sails.socket.broda
                }

                sails.res.api(200, ['success', 'QR Code will expire in 10 Seconds'], { qr })
            })

            this.client.on('auth_failure', (msg) => {
                sails.log.info(msg)
            })

            this.client.on('authenticated', (sess) => {
                console.log(sess)
                sails.log.info('Authentication success.')
            })

            this.client.on('ready', () => {
                sails.log.info(`Client for ${this.phoneNumber} is ready`)
            })
        }

        async start() {
            sails.log.info(`Whatsapp ${this.phoneNumber} instance is starting...`)
            return this.client.initialize()
        }

        async stop() {
            sails.log.info(`Whatsapp ${this.phoneNumber} instance is stoping...`)
            return this.client.destroy()
        }
    }

}