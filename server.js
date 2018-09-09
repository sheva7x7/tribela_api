require('dotenv').config()

const express = require('express'),
      app = express(),
      port = process.env.PORT || 3000,
      routes = require('./routes/index'),
      bodyParser = require('body-parser')

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true")
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token")
  next()
});
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.listen(port)
routes(app)

console.log('Tribela RESTful API server started on: ' + port);