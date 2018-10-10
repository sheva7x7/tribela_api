const _ = require('lodash')
const db = require('../../db')
const moment = require('moment-timezone')
const schema = process.env.DATABASE_ENV === 'test' ? 'test' : 'public'

moment.tz.setDefault("Asia/Singapore")

const createArticle = (req, res) => {
  const text = `INSERT INTO ${schema}.articles (article_type, creator, creation_time, title, summary, thumbnail_url, article_url, article_views,
    likes, expiration_time, publish_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
  const values =[
    req.body.article.article_type || null,
    req.body.article.creator,
    moment().format(),
    req.body.article.title,
    req.body.article.summary || null,
    req.body.article.thumbnail_url || null,
    req.body.article.article_url,
    0,
    0,
    req.body.article.expiration_time,
    req.body.article.publish_time || moment().format()
  ]
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const retrieveAnnouncements = (req, res) => {
  const text = `SELECT * FROM ${schema}.articles WHERE article_type = 1 AND expiration_time > CURRENT_TIMESTAMP ORDER BY publish_time DESC `
  values = []
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No announcement found'})
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

const retrieveNewsFeed = (req, res) => {
  const text = `SELECT * FROM ${schema}.articles WHERE article_type = 2 AND expiration_time > CURRENT_TIMESTAMP ORDER BY publish_time DESC `
  values = []
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No announcement found'})
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

const retrieveArticle = (req, res) => {
  const text = `SELECT * FROM ${schema}.articles WHERE id = $1`
  values = [
    req.body.article.id
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No article found'})
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

exports.createArticle = createArticle
exports.retrieveAnnouncements = retrieveAnnouncements
exports.retrieveArticle = retrieveArticle
exports.retrieveNewsFeed = retrieveNewsFeed