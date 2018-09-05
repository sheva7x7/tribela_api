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

createTransactions = (req,res) => {
  const values = []
  const n = req.body.transactions.length
  let text = `INSERT INTO ${schema}.transactions (sender_id, receiver_id, points, transaction_type, campaign_id, comment_id, remarks, transaction_time) 
  VALUES `
  req.body.transactions.forEach((transaction, i) => {
    text += `($${i*8+1}, $${i*8+2}, $${i*8+3}, $${i*8+4}, $${i*8+5}, $${i*8+6}, $${i*8+7}, $${i*8+8})`
    if (i < n-1) {
      text += ', '
    }
    values.push(transaction.sender_id)
    values.push(transaction.receiver_id)
    values.push(transaction.points)
    values.push(transaction.transaction_type)
    values.push(transaction.campaign_id)
    values.push(transaction.comment_id)
    values.push(transaction.remarks)
    values.push(moment().format())
  })
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  console.log(text, values)
  db.query(text, values, thenFn, catchFn)
}

exports.createTransaction = createTransaction
exports.retrieveTransactionsByUser = retrieveTransactionsByUser
exports.createTransactions = createTransactions