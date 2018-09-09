const jwt = require('jsonwebtoken')
const _ = require('lodash')
const fs = require('fs')

const privateKey = fs.readFileSync('jwt.key')
const publicKey = fs.readFileSync('jwt.key.pub')

const verifyJWTToken = (token) =>
{
  return new Promise((resolve, reject) =>
  {
    jwt.verify(token, publicKey, (err, decodedToken) => 
    {
      if (err || !decodedToken)
      {
        return reject(err)
      }

      resolve(decodedToken)
    })
  })
}

const createJWTToken = (user) => {
  let token = jwt.sign({
     data: user
    }, privateKey, {
      algorithm: 'RS512'
  })

  return token
}

const verifyJWT = (req, res, next) => {
  let token = req.header('token')
  verifyJWTToken(token)
    .then((decodedToken) =>
    {
      if (req.body.user){
        if (req.body.user.id === decodedToken.data.user_id || req.body.user.id === decodedToken.data.id){
          next()
        }
      }else if (req.body.vote) {
        if (req.body.vote.voter_id === decodedToken.data.id) {
          next()
        }
      }else if (req.body.voter_id ===  decodedToken.data.id) {
        next()
      }
      else{
        res.status(400)
        .json({message: "Invalid auth token provided."})
      }
    })
    .catch((err) =>
    {
      res.status(400)
        .json({message: "Invalid auth token provided."})
    })
}

exports.createJWTToken = createJWTToken
exports.verifyJWT = verifyJWT