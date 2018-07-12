const _ = require('lodash')
const db = require('../../db')
const moment = require('moment')
let schema = process.env.DATABASE_ENV === 'test' ? 'test' : 'public'

const createCampaign = (req, res) => {
  schema = req.body.campaign.test_env || schema
  const voteOptions = req.body.campaign.vote_options
  const optionsLength = voteOptions.length
  let optionsText = ''
  voteOptions.forEach((option, i) => {
    optionsText += `((SELECT id FROM new_campaign), '${option.option_no}', '${option.description}', 0)`
    if (i < optionsLength - 1){
      optionsText += ','
    }
  })
  const text = `WITH new_campaign AS (INSERT INTO ${schema}.campaigns (title, description, featured_image, 
    creator, creation_time, expiration_time) VALUES ($1, $2, $3, $4, $5,$6) RETURNING id) INSERT INTO ${schema}.vote_options 
    (campaign_id, option_no, description, vote_count) VALUES ${optionsText}`
  const values = [
    req.body.campaign.title,
    req.body.campaign.description,
    req.body.campaign.featured_image,
    req.body.campaign.creator,
    moment().format(),
    moment(req.body.campaign.expiration_time).format()
  ]
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  console.log(text)
  db.query(text, values, thenFn, catchFn)
}

exports.createCampaign = createCampaign