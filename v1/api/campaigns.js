const _ = require('lodash')
const db = require('../../db')
const moment = require('moment')
let schema = process.env.DATABASE_ENV === 'test' ? 'test' : 'public'

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
    creator, creation_time, expiration_time, category, no_of_views) VALUES ($1, $2, $3, $4, $5,$6, $7, $8) RETURNING id) INSERT INTO ${schema}.vote_options 
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

const retrieveCampaignById = (req, res) => {
  const text = `SELECT campaigns.*, SUM(vote_options.vote_count) AS total_vote_count, array_to_json(array_agg(vote_options)) AS options 
  FROM ${schema}.campaigns AS campaigns INNER JOIN ${schema}.vote_options AS vote_options ON campaigns.id = vote_options.campaign_id WHERE 
  campaigns.id = $1 GROUP BY campaigns.id `
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

const retriveTrendingCampaigns = (req, res) => {
  const text = `SELECT campaigns.*, SUM(vote_options.vote_count) AS total_vote_count FROM ${schema}.campaigns AS campaigns 
  INNER JOIN ${schema}.vote_options AS vote_options ON campaigns.id = vote_options.campaign_id WHERE expiration_time >= CURRENT_TIMESTAMP
  GROUP BY campaigns.id ORDER BY creation_time::DATE DESC, total_vote_count DESC, (expiration_time - CURRENT_TIMESTAMP) ASC LIMIT 20 OFFSET $1`
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
      res.send(true)
    } else {
      res.send(false)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

exports.createCampaign = createCampaign
exports.retrieveCampaignById = retrieveCampaignById
exports.retrieveCampaignOptions = retrieveCampaignOptions
exports.retriveTrendingCampaigns = retriveTrendingCampaigns
exports.voting = voting
exports.isCampaignVoted = isCampaignVoted