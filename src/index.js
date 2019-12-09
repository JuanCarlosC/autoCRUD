const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const config = require('./utils/config')
const models = require('./models')

const api = express()
const routes =  express.Router()

api.use(bodyParser.urlencoded({extended: false}))
api.use(bodyParser.json({limit: '100kb'}))
config.createModelsAndRoutes(api, models)

const connect = async () => {
    const connection = mongoose.connect('mongodb://localhost:27017/auto-crud', { useNewUrlParser: true, useUnifiedTopology: true })

    await connection.then(db => {
        console.log('connected to db')
        return db
    }).catch(err => {
        console.log('Err connecting to mongodb', err)
    })
}

routes.get('/', (req, res) => {
    const resp = { success: true, msg: 'Wassup Homie!!' }
    res.json(resp);
})

api.listen(8888, (err) => {
    if (err) process.exit(1)

    connect()
    api.use('/v1', routes)
    console.log('server is running on port 8888.')
})
