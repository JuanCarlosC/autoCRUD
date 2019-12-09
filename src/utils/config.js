const mongoose = require('mongoose')
const express = require('express')

// var TestingSchema = require('mongoose').model('Song').schema

const createController = (configModel, mongooseModel) => {
    if (!configModel || !mongooseModel) {
        return new Error('Configuration and mongoose model required.')
    }

    const MODEL_OBJECT = mongooseModel
    const NAME_PLURAL = (configModel.hasOwnProperty('meta') && configModel.meta.plural) || (configModel.name || 'item').toLowerCase()
    const NAME_SINGULAR = (configModel.hasOwnProperty('meta') && configModel.meta.singular) || (configModel.name || 'item').toLowerCase()
    const controllerMethods = {}

    controllerMethods.list = async (req, res) => {
        let query = {}
        let successData = {}

        try {
            let listData = await MODEL_OBJECT.find(query)
            successData.msg = `Successfully fetched ${NAME_PLURAL}.`
            successData[NAME_PLURAL] = listData

            return res.json({ success: true, data: successData })
        } catch (err) {
            return res.json({ success: false, error: err })
        }
    }

    controllerMethods.create = async (req, res) => {
        let err = {}
        let successData = {}

        let newObjectData = {}

        if (req.body) {
            const configProperties = Object.keys(configModel.properties)

            configProperties.forEach(property => {
                const propertyValue = req.body[property]
                const propertyConfig = configModel.properties[property]
                let isValid = true

                if (!propertyConfig) { return false }

                if (propertyConfig.hasOwnProperty('required') && propertyConfig.required) {
                    if (!req.body.hasOwnProperty(property)) {
                        let errMsg = propertyConfig.requiredErrorMsg || ('Property "' + property  + '" field is required. ')
                        if (!err.msg) err.msg = ''
                        err.msg += errMsg
                        return
                    }
                }

                if (propertyConfig.validate && typeof propertyConfig.validate === 'function') {
                    isValid = propertyConfig.validate(propertyValue)
                    
                    if (!isValid) {
                        let errMsg = propertyConfig.validateErrorMsg || ('Error validating ' + property)
                        if (!err.msg) err.msg = ''
                        err.msg += errMsg
                        return
                    }
                }

                if (isValid) {
                    newObjectData[property] = propertyValue

                    if (!req.body.hasOwnProperty(property) && configProperties.hasOwnProperty('default')) {
                        newObjectData[property] = configProperties.default
                    }
                }
            })
        }

        if (Object.keys(err).length > 0) {
            return res.json({ success: false, error: err })
        }

        try {
            let saveObjData = new MODEL_OBJECT(newObjectData)
            let successfullySavedObj = await saveObjData.save()
            successData.msg = `Successfully created ${NAME_SINGULAR}.`
            successData[NAME_SINGULAR] = successfullySavedObj
            
            return res.json({ success: true, data: successData, code: 201 })
        } catch (err) {
            return res.json({ success: false, error: err })
        }
    }

    controllerMethods.update = async (req, res) => {
        let err = {}
        let successData = {}

        try {
            let updateObj = await MODEL_OBJECT.findById(req.params.id)

            if (!updateObj) {
                err.msg('Error finding ' + NAME_SINGULAR)
                return res.json({ success: false, error: err, code: 422 })    
            }

            if (req.body) {
                const configProperties = Object.keys(configModel.properties)
    
                configProperties.forEach(property => {
                    if (!req.body.hasOwnProperty(property)) { return false }

                    const propertyValue = req.body[property]
                    const propertyConfig = configModel.properties[property]
                    if (!propertyConfig) { return false }

                    let isValid = true
    
                    if (propertyConfig.hasOwnProperty('required') && propertyConfig.required) {
                        if (!req.body.hasOwnProperty(property)) {
                            let errMsg = propertyConfig.requiredErrorMsg || ('Property "' + property  + '" field is required. ')
                            if (!err.msg) err.msg = ''
                            err.msg += errMsg
                            return
                        }
                    }
    
                    if (propertyConfig.validate && typeof propertyConfig.validate === 'function') {
                        isValid = propertyConfig.validate(propertyValue)
                        
                        if (!isValid) {
                            let errMsg = propertyConfig.validateErrorMsg || ('Error validating ' + property)
                            if (!err.msg) err.msg = ''
                            err.msg += errMsg
                            return
                        }
                    }
    
                    if (isValid) {
                        updateObj[property] = propertyValue
                    }
                })
            }

            if (Object.keys(err).length > 0) {
                return res.json({ success: false, error: err })
            }

            let updatedModelObject = await updateObj.save()

            if (!updatedModelObject) {
                err.msg = `Failed to update ${NAME_SINGULAR}. `
                return res.json({ success: false, error: err })
            }

            successData.msg = `Successfully updated ${NAME_SINGULAR}.`
            successData[NAME_SINGULAR] = updatedModelObject

            return res.json({ success: true, data: successData })
        } catch (err) {
            return res.json({ success: false, error: err, code: 422 })
        }
    }

    controllerMethods.delete = async (req, res) => {
        let successData = {}

        try {
            let removeModelObject = await MODEL_OBJECT.deleteOne({ _id: req.params.id })
            console.log(`${NAME_SINGULAR} deleted:`, removeModelObject)

            successData.msg = `Successfully deleted ${NAME_SINGULAR}.`

            return res.json({ success: true, data: successData })
        } catch (err) {
            return res.json({ success: false, error: err, code: 422 }) 
        }
    }

    return controllerMethods
}

const createModelsAndRoutes = async (api, models) => {
    if (models && Array.isArray(models) && models.length > 0) {
        for (let model in models) {
            const config = models[model]

            if (!config.hasOwnProperty('name') || typeof config.name !== 'string' || config.name.length === 0) {
                // return new Error('Requires model "name".')
                console.error('Skipping configuration for model: ', config)
                console.error('Model name is required.')
                console.log('============')
                return
            }

            const schemaObj = {}

            if (config && config.properties) {
                let model = config.properties
                if (typeof model === 'object') {
                    const properties = Object.keys(model)
                    if (properties.length > 0) {
                        properties.forEach(prop => {
                            if (typeof model[prop] === 'object') {
                                const property = model[prop]
                                let type = String // Default to String
                                if (property.hasOwnProperty('type')) {
                                    // need to do a type check
                                    type = property.type
                                }
                                schemaObj[prop] = type
                            }
                        })
                    }
            }
            }
            
            const modelName = config.name.charAt(0).toUpperCase() + (config.name.slice(1)).toLowerCase()
            const createSchema = new mongoose.Schema(schemaObj, { strict: false })
            const mongooseModel = mongoose.model(modelName, createSchema)
            const createControllers = createController(config, mongooseModel)

            if (createControllers) {
                const modelRoutes =  express.Router()
                let modelRouteName = '/v1/' + modelName.toLowerCase()

                if (config.meta && config.meta.path) {
                    modelRouteName = '/v1/' + config.meta.path
                }

                modelRoutes.get(modelRouteName , createControllers.list)
                modelRoutes.post(modelRouteName , createControllers.create)
                modelRoutes.put(modelRouteName + '/:id' , createControllers.update)
                modelRoutes.delete(modelRouteName + '/:id', createControllers.delete)

                api.use(modelRoutes)
            }
        }
    }
}

module.exports = { createModelsAndRoutes }