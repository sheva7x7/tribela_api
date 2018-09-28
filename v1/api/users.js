const _ = require('lodash')
const axios = require('axios')
const uuid = require('uuid/v4')
const db = require('../../db')
const constants = require('../../utils/constants')
const jwt = require('../../middleware/jwt')
const moment = require('moment-timezone')
const schema = process.env.DATABASE_ENV === 'test' ? 'test' : 'public'

moment.tz.setDefault("Asia/Singapore")

const login = (req,res) => {
  const text = `SELECT accounts.*, users.email, users.validated FROM ${schema}.users AS users INNER JOIN ${schema}.accounts AS accounts ON users.id = accounts.user_id WHERE users.login_id = $1 AND users.password = crypt($2, users.password)`
  const values =[
    req.body.user.login_id,
    req.body.user.password
  ]
  const thenFn = (results) => {
    const result = results.rows[0]
    if (!result.validated){
      res.status(401).send({message: 'Email not verified'})
    }
    else {
      const userData = {
        id: result.id,
        email: result.email,
        user_id: result.user_id
      }
      const token = jwt.createJWTToken(userData)
      result.token = token
      res.send(result)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const verifyUser = (req, res) => {
  const text = `SELECT accounts.*, users.email, users.validated, users.validation_string FROM ${schema}.users AS users INNER JOIN ${schema}.accounts AS accounts ON users.id = accounts.user_id WHERE users.login_id = $1 AND users.password = crypt($2, users.password)`
  const values =[
    req.body.user.login_id,
    req.body.user.password
  ]
  const thenFn = (results) => {
    const result = results.rows[0]
    console.log(req.body.user.validation_string, result, result.validation_string !== req.body.user.validation_string)
    if (!result) {
      res.status(403).send({message: 'Username or password is correct'})
    }
    else if (result.validated) {
      res.status(422).send({message: "User already varified"})
    }
    else if (result.validation_string !== req.body.user.validation_string){
      res.status(401).send({message: 'Invalid Link!'})
    }
    else {
      delete result.validated
      delete result.validation_string
      updateValidation(res, req.body.user.login_id, result)
    }
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const updateValidation = (res, login_id, result) => {
  const text = `UPDATE ${schema}.users SET validated = true WHERE login_id = $1`
  const values =[
    login_id
  ]
  const thenFn = (results) => {
    const userData = {
      id: result.id,
      email: result.email,
      user_id: result.user_id
    }
    const token = jwt.createJWTToken(userData)
    result.token = token
    res.send(result)
  }
  const catchFn = (error) => {
    res.status(500).send({message: 'DB error'})
  }
  db.query(text, values, thenFn, catchFn)
}

const createUser = (req, res) => {
  const validation_string = uuid()
  const text = `INSERT INTO ${schema}.users (login_id, email, password, created_on, validated, validation_string, mailing_list, referrer_code) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5, $6, $7, $8)`
  const values = [
    req.body.user.login_id,
    req.body.user.email,
    req.body.user.password,
    moment().format(),
    false,
    validation_string,
    req.body.user.mailing_list || false,
    req.body.user.referral_code || null
  ]
  const thenFn = (results) => {
    const headers = {
      'Authorization': constants.EMAIL_AUTHTOKEN,
      'Content-Type': 'application/json;odata=verbose'
    }
    const data = {
      subject: "Stuff War - Confirm your email address",
      fromAddress: "info@tribela.io",
      toAddress: req.body.user.email,
      content: `Dear user, <br><br>Stuff War rewards you when you win the vote. Let’s get started. <br><br>Please confirm your email address by 
      clicking on this link: <br><br>${constants.BASE_URL}emailverification/${validation_string}<br><br>Tribela`
    }
    axios.post(`https://mail.zoho.com/api/accounts/${constants.EMAIL_ACCOUNT_ID}/messages`, data, {headers})
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

const retrieveReferralCode = (req, res) => {
  const text = `SELECT referral_code FROM ${schema}.accounts WHERE id = $1 `
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

exports.login = login
exports.createUser = createUser
exports.getUserAccount = getUserAccount
exports.updatePassword = updatePassword
exports.updateUsername = updateUsername
exports.verifyUser = verifyUser
exports.retrieveReferralCode = retrieveReferralCode