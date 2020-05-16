/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  '/': { view: 'pages/homepage' },

  // REST API Routes
  'POST r|^/(agent)?(user)?/auth$|agent,user': 'AuthController.index',
  'GET /users': 'UserController.find',
  'GET /user/:id': 'UserController.findOne',
  'POST /user': 'UserController.create',
  'PATCH /user/:id': 'UserController.update',
  'DELETE /user/:id': 'UserController.delete',
  'GET /phonenumbers': 'PhoneNumberController.find',
  'GET /phonenumber/:id': 'PhoneNumberController.findOne',
  'POST /phonenumber': 'PhoneNumberController.create',
  'PATCH /phonenumber/:id': 'PhoneNumberController.update',
  'DELETE /phonenumber/:id': 'PhoneNumberController.delete',
  'GET /roles': 'RoleController.find',
  'GET /role/:id': 'RoleController.findOne',
  'POST /role': 'RoleController.create',
  'PATCH /role/:id': 'RoleController.update',
  'DELETE /role/:id': 'RoleController.delete',

  // Other Routes
  'GET /refreshtoken': 'AuthController.refreshToken',
  'POST /register': 'UserController.create',
};
