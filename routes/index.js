const usersApi = require('../v1/api/users')
const campaignsApi = require('../v1/api/campaigns')

module.exports = function(app) {
  app.route('/')
    .get(function(req,res){
      res.status(200).send('OK')
    })

  app.route('/v1/login')
    .post(usersApi.login)

  app.route('/v1/newuser')
    .post(usersApi.createUser)

  app.route('/v1/newcampaign')
    .post(campaignsApi.createCampaign)
}