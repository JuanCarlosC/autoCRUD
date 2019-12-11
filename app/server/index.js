const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const autoCRUD = require('./utils/autoCRUD')
const resources = require('./resources')

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json({limit: '100kb'}))

autoCRUD.create({
    expressApp: app,
    resources: resources,
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
