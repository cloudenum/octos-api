module.exports = {
    async isAllowed(req, controller, action) {
        const token = req.headers.authorization.substring(7).trim()
        const JWTPayload = JWTService.verify(token)
        if (JWTPayload.userId) {
            const user = await User.findOne({ id: JWTPayload.userId }).populate('role')

            if (!user) {
                return false
            }

            if (user.role.name !== 'superuser') {
                if (!user.role.perms[controller][action]) {
                    return false
                }
            }
        } else if (JWTPayload.agentId) {
            const agent = await Agent.findOne({ id: JWTPayload.agentId }).populate('role')

            if (!agent) {
                return false
            }

            if (!agent.role.perms[controller][action]) {
                return false
            }
        } else {
            return false
        }

        return true
    },

    async isAdmin(req) {
        const token = req.headers.authorization.substring(7).trim()
        const JWTPayload = JWTService.verify(token)
        if (JWTPayload.userId) {
            const user = await User.findOne({ id: JWTPayload.userId }).populate('role')

            if (!user) {
                return false
            }

            if (user.role.isAdmin) {
                return true
            }
        }

        return false
    },

    async getRole(req) {
        const token = req.headers.authorization.substring(7).trim()
        const JWTPayload = JWTService.verify(token)
        if (JWTPayload.userId) {
            const user = await User.findOne({ id: JWTPayload.userId }).populate('role')

            return user.role
        } else if (JWTPayload.agentId) {
            const role = await role.findOne({ name: 'agent' })

            return role
        }
    },

    async onlyMe(req) {
        const token = req.headers.authorization.substring(7).trim()
        const JWTPayload = JWTService.verify(token)

        if (JWTPayload.userId) {
            const user = await User.findOne({ id: JWTPayload.userId }).populate('role')

            if (!user.role.isAdmin) {
                if (JWTPayload.userId != req.params.id) {
                    return false
                }
            }
        } else if (JWTPayload.agentId) {
            if (JWTPayload.agentId != req.params.id) {
                return false
            }
        } else {
            return false
        }

        return true
    }
}