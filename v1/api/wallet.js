const _ = require('lodash')
const db = require('../../db')
const moment = require('moment-timezone')
const schema = process.env.DATABASE_ENV === 'test' ? 'test' : 'public'

moment.tz.setDefault("Asia/Singapore")

const createTransaction = (req, res) => {
  const text = `INSERT INTO ${schema}.transactions (sender_id, receiver_id, points, transaction_type, campaign_id, comment_id, remarks, transaction_time) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
  const values =[
    req.body.transaction.sender_id,
    req.body.transaction.receiver_id,
    req.body.transaction.points,
    req.body.transaction.transaction_type,
    req.body.transaction.campaign_id,
    req.body.transaction.comment_id,
    req.body.transaction.remarks,
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

const retrieveTransactionsByUser = (req, res) => {
  const text = `SELECT * FROM ${schema}.transactions WHERE sender_id = $1 OR receiver_id = $1 ORDER BY transaction_time DESC LIMIT 50 OFFSET $2 `
  const values =[
    req.body.user.id,
    req.body.offset || 0
  ]
  const thenFn = (results) => {
    if (_.isEmpty(results.rows)){
      res.status(600).send({message: 'No transaction found'})
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

exports.createTransaction = createTransaction
exports.retrieveTransactionsByUser = retrieveTransactionsByUser