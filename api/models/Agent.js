module.exports = {
    attributes: {
        email: {
            type: "string",
            isEmail: true,
            required: true,
            unique: true,
        },
        fullname: {
            type: "string",
            required: true,
        },
        password: {
            type: 'string',
            required: true,
        },
        role: {
            model: 'role',
            columnName: 'roleId'
        },
        company: {
            model: 'company',
            columnName: 'companyId'
        },
        manager: {
            model: 'User',
            columnName: 'userManagerId'
        },
        subscribedPhoneNumber: {
            model: 'PhoneNumber',
            columnName: 'subscribedPhoneNumberId'
        }
    }
}