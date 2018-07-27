const _ = require('lodash')
const db = require('../../db')
const moment = require('moment')
const schema = process.env.DATABASE_ENV === 'test' ? 'test' : 'public'

const login = (req,res) => {
  const text = `SELECT accounts.*, users.email FROM ${schema}.users AS users INNER JOIN ${schema}.accounts AS accounts ON users.id = accounts.user_id WHERE users.login_id = $1 AND users.password = crypt($2, users.password)`
  const values =[
    req.body.user.login_id,
    req.body.user.password
  ]
  const thenFn = (results) => {    
    res.send(results.rows[0])
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const createUser = (req, res) => {
  const text = `INSERT INTO ${schema}.users (login_id, email, password, created_on) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4)`
  const values = [
    req.body.user.login_id,
    req.body.user.email,
    req.body.user.password,
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

const getUserAccount = (req, res) => {
  const text = `SELECT accounts.*, users.email FROM ${schema}.users AS users INNER JOIN ${schema}.accounts AS accounts ON users.id = accounts.user_id WHERE users.id = $1 `
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

const updateUsername = (req, res) => {
  const text = `UPDATE ${schema}.accounts SET username = $2 WHERE id = $1`
  const values = [
    req.body.user.id,
    req.body.user.username
  ]
  const thenFn = (results) => {
    res.end()
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const updatePassword = (req, res) => {
  const text = `UPDATE ${schema}.users SET password = crypt($3, gen_salt('bf')) WHERE id = $1 AND password = crypt($2, password)`
  const values = [
    req.body.user.user_id,
    req.body.user.password,
    req.body.user.newPassword
  ]
  const thenFn = (results) => {
    res.send({rowCount: results.rowCount})
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

exports.login = login
exports.createUser = createUser
exports.getUserAccount = getUserAccount
exports.updatePassword = updatePassword
exports.updateUsername = updateUsername