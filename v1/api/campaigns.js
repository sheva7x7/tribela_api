const _ = require('lodash')
const db = require('../../db')
const moment = require('moment-timezone')
const schema = process.env.DATABASE_ENV === 'test' ? 'test' : 'public'

moment.tz.setDefault("Asia/Singapore")

const createCampaign = (req, res) => {
  const voteOptions = req.body.campaign.vote_options
  const optionsLength = voteOptions.length
  let optionsText = ''
  const values = [
    req.body.campaign.title,
    req.body.campaign.description,
    req.body.campaign.featured_image,
    req.body.campaign.creator,
    moment().format(),
    moment(req.body.campaign.expiration_time).format(),
    moment(req.body.campaign.launch_time).format(),
    req.body.campaign.category,
    0
  ]
  voteOptions.forEach((option, i) => {
    optionsText += `((SELECT id FROM new_campaign), $${values.length+1}, $${values.length+2}, $${values.length+3})`
    values.push(option.option_no, option.description, 0)
    if (i < optionsLength - 1){
      optionsText += ','
    }
  })
  const text = `WITH new_campaign AS (INSERT INTO ${schema}.campaigns (title, description, featured_image, 
    creator, creation_time, expiration_time, launch_time, category, no_of_views) VALUES ($1, $2, $3, $4, $5,$6, $7, $8, $9) RETURNING id) INSERT INTO ${schema}.vote_options 
    (campaign_id, option_no, description, vote_count) VALUES ${optionsText}`
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  console.log(text, values)
  db.query(text, values, thenFn, catchFn)
}

const createCampaignInfo = (req, res) => {
  const campaignOptions = req.body.campaign.options
  const optionsLength = campaignOptions.length
  let text = `INSERT INTO ${schema}.campaign_info (campaign_id, option_id, description, option_gallery, creator, creation_time) VALUES `
  const values = []
  campaignOptions.forEach((option, i) => {
    text += `($${values.length+1}, $${values.length+2}, $${values.length+3}, $${values.length+4}, $${values.length+5}, $${values.length+6})`
    values.push(
      option.campaign_id,
      option.option_id,
      option.description,
      option.option_gallery,
      option.creator,
      moment().format()
    )
    if (i < optionsLength - 1){
      text += ','
    }
  })
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveCampaignByUser = (req, res) => {
  const text = `SELECT campaigns.*, votes.option_id AS voted_option_id, SUM(vote_options.vote_count) AS total_vote_count, array_to_json(array_agg(vote_options ORDER BY option_no)) 
  AS options FROM ${schema}.campaigns AS campaigns INNER JOIN ${schema}.vote_options AS vote_options ON campaigns.id = vote_options.campaign_id 
  INNER JOIN ${schema}.votes AS votes ON votes.campaign_id = campaigns.id WHERE campaigns.launch_time <= CURRENT_TIMESTAMP AND 
  votes.voter_id = $1 GROUP BY campaigns.id, votes.id ORDER BY votes.vote_time DESC LIMIT 20 OFFSET $2`
  const values = [
    req.body.user.id,
    req.body.offset
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No campaign found'})
    }
    else{
      res.send(results.rows)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveUserCampaignCount = (req, res) => {
  const text = `SELECT COUNT(*) FROM ${schema}.campaigns AS campaigns INNER JOIN ${schema}.votes AS votes ON 
  votes.campaign_id = campaigns.id WHERE campaigns.launch_time <= CURRENT_TIMESTAMP AND votes.voter_id = $1 `
  const values = [
    req.body.user.id
  ]
  const thenFn = (results) => {
    res.send(results.rows[0])
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveCampaignById = (req, res) => {
  const text = `SELECT campaigns.*, SUM(vote_options.vote_count) AS total_vote_count, array_to_json(array_agg(vote_options ORDER BY option_no)) 
  AS options FROM ${schema}.campaigns AS campaigns INNER JOIN ${schema}.vote_options AS vote_options ON campaigns.id = vote_options.campaign_id 
  WHERE campaigns.id = $1 AND campaigns.launch_time <= CURRENT_TIMESTAMP GROUP BY campaigns.id`
  const values = [
    req.params.id
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No campaign found'})
    }
    else{
      res.send(results.rows[0])
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveCampaignInfo = (req, res) => {
  const text = `SELECT * FROM ${schema}.campaign_info WHERE option_id = $1 `
  const values = [
    req.params.id
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No info found'})
    }
    else{
      res.send(results.rows[0])
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveCampaignOptions = (req, res) => {
  const text = `SELECT * FROM ${schema}.vote_options WHERE campaign_id = $1 `
  const values = [
    req.params.id
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No option found'})
    }
    else{
      res.send(results.rows)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const createCampaignComment = (req, res) => {
  const text = `INSERT INTO ${schema}.campaign_comments (campaign_id, option_id, root_id, parent_id, body, creator_id, creation_time, master_comment, is_root) VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`
  const values = [
    req.body.comment.campaign_id,
    req.body.comment.option_id,
    req.body.comment.root_id || null,
    req.body.comment.parent_id || null,
    req.body.comment.body,
    req.body.comment.creator_id,
    moment().format(),
    req.body.comment.master_comment || false,
    req.body.comment.is_root || false,
  ]
  const thenFn = (results) => {
    res.send(results.rows[0])
  }
  const catchFn = (error) => {
    if (error.code === '23505'){
      res.status(412).send({message: 'Cannot create'})
    }
    else {
      res.status(500).send({message: 'DB error'})
    }
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveRootCommentsByOption = (req, res) => {
  const text = `SELECT comments.*, accounts.username FROM ${schema}.campaign_comments AS comments INNER JOIN 
  ${schema}.accounts AS accounts ON comments.creator_id = accounts.id WHERE comments.option_id = $1 AND comments.is_root IS TRUE ORDER BY comments.master_comment DESC, 
  comments.upvote DESC, comments.replies DESC, comments.downvote DESC, comments.creation_time DESC LIMIT 20 OFFSET $2 `
  const values = [
    req.body.option_id,
    req.body.offset || 0
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No comment found'})
    }
    else{
      res.send(results.rows)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveCampaignCommentsByRootId = (req, res) => {
  const text = `SELECT comments.*, accounts.username FROM ${schema}.campaign_comments AS comments 
  INNER JOIN ${schema}.accounts AS accounts ON comments.creator_id = accounts.id WHERE comments.root_id = $1 `
  const values = [
    req.body.root_id
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No comment found'})
    }
    else{
      res.send(results.rows)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveTrendingCampaigns = (req, res) => {
  const text = `SELECT campaigns.*, SUM(vote_options.vote_count) AS total_vote_count, array_to_json(array_agg(vote_options ORDER BY option_no)) AS options
  FROM ${schema}.campaigns AS campaigns INNER JOIN ${schema}.vote_options AS vote_options ON campaigns.id = vote_options.campaign_id WHERE expiration_time >= CURRENT_TIMESTAMP
  AND campaigns.launch_time <= CURRENT_TIMESTAMP GROUP BY campaigns.id ORDER BY total_vote_count DESC, creation_time::DATE DESC, (expiration_time - CURRENT_TIMESTAMP) ASC LIMIT 20 OFFSET $1`
  const values = [
    req.body.offset || 0
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No option found'})
    }
    else{
      res.send(results.rows)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveHofCampaigns = (req, res) => {
  const text = `SELECT campaigns.*, SUM(vote_options.vote_count) AS total_vote_count, array_to_json(array_agg(vote_options ORDER BY option_no)) AS options
  FROM ${schema}.campaigns AS campaigns INNER JOIN ${schema}.vote_options AS vote_options ON campaigns.id = vote_options.campaign_id WHERE expiration_time <= CURRENT_TIMESTAMP 
  GROUP BY campaigns.id ORDER BY total_vote_count DESC, expiration_time::DATE DESC, no_of_views DESC LIMIT 20 OFFSET $1`
  const values = [
    req.body.offset || 0
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No option found'})
    }
    else{
      res.send(results.rows)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveFeaturedCampaigns = (req, res) => {
  const text = `SELECT campaigns.*, SUM(vote_options.vote_count) AS total_vote_count, array_to_json(array_agg(vote_options ORDER BY option_no)) 
  AS options FROM ${schema}.campaigns AS campaigns INNER JOIN ${schema}.vote_options AS vote_options ON campaigns.id = vote_options.campaign_id WHERE expiration_time >= CURRENT_TIMESTAMP
  AND campaigns.launch_time <= CURRENT_TIMESTAMP GROUP BY campaigns.id ORDER BY creation_time::DATE DESC, total_vote_count DESC, (expiration_time - CURRENT_TIMESTAMP) ASC LIMIT 20 OFFSET $1`
  const values = [
    req.body.offset || 0
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No option found'})
    }
    else{
      res.send(results.rows)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const voting = (req, res) => {
  const text = `INSERT INTO ${schema}.votes (voter_id, campaign_id, option_id, vote_time) VALUES ($1, $2, $3, $4)`
  const values = [
    req.body.vote.voter_id,
    req.body.vote.campaign_id,
    req.body.vote.option_id,
    moment().format()
  ]
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const isCampaignVoted = (req, res) => {
  const text = `SELECT * FROM ${schema}.votes WHERE voter_id = $1 AND campaign_id = $2`
  const values = [
    req.body.vote.voter_id,
    req.body.vote.campaign_id
  ]
  const thenFn = (results) => {
    if (results.rows.length > 0) {
      res.send(results.rows[0])
    } else {
      res.send(false)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const updateCampaignView = (req, res) => {
  const text = `UPDATE ${schema}.campaigns SET no_of_views = no_of_views + 1 WHERE id = $1`
  const values = [
    req.body.campaign.id
  ]
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const votedCampaignsList = (req, res) => {
  const text = `SELECT campaign_id, option_id FROM ${schema}.votes WHERE voter_id = $1`
  const values = [
    req.body.vote.voter_id
  ]
  const thenFn = (results) => {
    res.send(results.rows)
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const upvoteComment = (req, res) => {
  const text = `INSERT INTO ${schema}.campaign_comment_votes (comment_id, voter_id, vote) VALUES ($1, $2, $3)`
  const values = [
    req.body.comment_id,
    req.body.voter_id,
    1
  ]
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    if (error.code === '23505'){
      res.status(412).send({message: 'Cannot create'})
    }
    else {
      res.status(500).send({message: 'DB error'})
    }
  }
  db.query(text, values, thenFn, catchFn)
}

const downvoteComment = (req, res) => {
  const text = `INSERT INTO ${schema}.campaign_comment_votes (comment_id, voter_id, vote) VALUES ($1, $2, $3)`
  const values = [
    req.body.comment_id,
    req.body.voter_id,
    -1
  ]
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    if (error.code === '23505'){
      res.status(412).send({message: 'Cannot create'})
    }
    else {
      res.status(500).send({message: 'DB error'})
    }
  }
  db.query(text, values, thenFn, catchFn)
}

exports.createCampaign = createCampaign
exports.createCampaignInfo = createCampaignInfo
exports.retrieveCampaignInfo = retrieveCampaignInfo
exports.retrieveCampaignById = retrieveCampaignById
exports.retrieveCampaignOptions = retrieveCampaignOptions
exports.retrieveTrendingCampaigns = retrieveTrendingCampaigns
exports.retrieveHofCampaigns = retrieveHofCampaigns
exports.voting = voting
exports.isCampaignVoted = isCampaignVoted
exports.retrieveFeaturedCampaigns = retrieveFeaturedCampaigns
exports.updateCampaignView = updateCampaignView
exports.votedCampaignsList = votedCampaignsList
exports.createCampaignComment = createCampaignComment
exports.retrieveCampaignCommentsByRootId = retrieveCampaignCommentsByRootId
exports.retrieveRootCommentsByOption = retrieveRootCommentsByOption
exports.upvoteComment = upvoteComment
exports.downvoteComment = downvoteComment
exports.retrieveCampaignByUser = retrieveCampaignByUser
exports.retrieveUserCampaignCount = retrieveUserCampaignCount