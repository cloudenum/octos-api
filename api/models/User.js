/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

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

    phoneNumbers: {
      collection: 'phonenumber',
      via: 'user'
    },
    agents: {
      collection: 'Agent',
      via: 'manager'
    }
  },
};

