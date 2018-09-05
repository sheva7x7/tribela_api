const usersApi = require('../v1/api/users')
const campaignsApi = require('../v1/api/campaigns')
const walletApi = require('../v1/api/wallet')

module.exports = function(app) {
  app.route('/')
    .get(function(req,res){
      res.status(200).send('OK')
    })

  app.route('/v1/login')
    .post(usersApi.login)

  app.route('/v1/newuser')
    .post(usersApi.createUser)

  app.route('/v1/verifyuser')
    .post(usersApi.verifyUser)

  app.route('/v1/newcampaign')
    .post(campaignsApi.createCampaign)

  app.route('/v1/campaigninfo')
    .post(campaignsApi.createCampaignInfo)

  app.route('/v1/campaigninfo/:id')
    .get(campaignsApi.retrieveCampaignInfo)

  app.route('/v1/newcampaigncomment')
    .post(campaignsApi.createCampaignComment)

  app.route('/v1/campaigncomments')
    .post(campaignsApi.retrieveRootCommentsByOption)

  app.route('/v1/subcomments')
    .post(campaignsApi.retrieveCampaignCommentsByRootId)

  app.route('/v1/myvotedcampaigns')
    .post(campaignsApi.retrieveCampaignByUser)

  app.route('/v1/myvotedcampaignscount')
    .post(campaignsApi.retrieveUserCampaignCount)

  app.route('/v1/upvotecomment')
    .post(campaignsApi.upvoteComment)

  app.route('/v1/downvotecomment')
    .post(campaignsApi.downvoteComment)

  app.route('/v1/campaign/:id')
    .get(campaignsApi.retrieveCampaignById)

  app.route('/v1/campaignoptions/:id')
    .get(campaignsApi.retrieveCampaignOptions)

  app.route('/v1/trendingcampaigns')
    .post(campaignsApi.retriveTrendingCampaigns)

  app.route('/v1/featuredcampaigns')
    .post(campaignsApi.retrieveFeaturedCampaigns)

  app.route('/v1/voting')
    .post(campaignsApi.voting)

  app.route('/v1/campaignvoted')
    .post(campaignsApi.isCampaignVoted)

  app.route('/v1/votedcampaigns')
    .post(campaignsApi.votedCampaignsList)

  app.route('/v1/campaignviews')
    .post(campaignsApi.updateCampaignView)

  app.route('/v1/profile')
    .post(usersApi.getUserAccount)

  app.route('/v1/password')
    .post(usersApi.updatePassword)

  app.route('/v1/username')
    .post(usersApi.updateUsername)

  app.route('/v1/newtransaction')
    .post(walletApi.createTransaction)

  app.route('/v1/newbatchtransactions')
    .post(walletApi.createTransactions)

  app.route('/v1/usertranactions')
    .post(walletApi.retrieveTransactionsByUser)
}