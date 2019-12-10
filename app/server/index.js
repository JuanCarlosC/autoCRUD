const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const config = require('./utils/config')
const models = require('./models')

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json({limit: '100kb'}))

config.createModelsAndRoutes({
    expressApp: app,
    resources: models,
    route: '/api/v1/'
})

app.use(express.static(path.join(__dirname + '/../client')));

const connect = async () => {
    const connection = mongoose.connect('mongodb://localhost:27017/auto-crud', { useNewUrlParser: true, useUnifiedTopology: true })

    await connection.then(db => {
        console.log('connected to db')
        return db
    }).catch(err => {
        console.log('Err connecting to mongodb', err)
    })
}

app.listen(8888, (err) => {
    if (err) process.exit(1)

    connect()
    console.log('server is running on port 8888.')
})
