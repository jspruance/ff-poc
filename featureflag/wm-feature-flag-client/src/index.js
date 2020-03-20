/**
 * @module wm-feature-flag-client
 */
/**
 * Copyright (c) Warner Media. All rights reserved.
 */

'use strict'
const crypto = require('crypto')
const { v4 } = require('uuid')
const winston = require('winston');
const logger = winston.createLogger({
  transports: [ new winston.transports.Console()]
})

class FeatureFlagClient {
  constructor(userId, appId, config) {
    this.appId = appId
    this.config = config
    this.userId = userId
  }

  createHash(userId, salt) {
    const hash = crypto.createHmac('sha256', salt)
    hash.update(userId)
    const hashValue = hash.digest('hex')
    return hashValue
  }

  createUserId() {
    const userId = v4()
    return userId
  }

  getUserFeatureIndex(hash) {
    const hashSegment = parseInt(hash.slice(-2), 16)
    return hashSegment.toString().slice(-2)
  }

  async init() {
    this.config = this.config ? this.config : await this.loadConfig()
    this.userId = this.userId ? this.userId : this.createUserId()
  }

  async loadConfig() {
    // placeholder for fetching of the app's feature config file from AWS S3
    return new Promise((resolve, reject) => {
      const testConfig = require('../config/app-a.json')
      setTimeout(() => resolve(testConfig), 300)
    })
  }

  queryFeature(featureName) {
    try {
      const featureConfig = this.config.features.filter(feature => feature.name === featureName)
      const saltKey = featureConfig[0].saltKey
      const hash = this.createHash(this.userId, saltKey)
      const userFeatureIndex = this.getUserFeatureIndex(hash)
      console.log(`\n${featureConfig[0].name}`)
      console.log(`rollout rate: ${featureConfig[0].rolloutRate}`)
      console.log(`user feature index: ${userFeatureIndex}`)
      const enabled = (parseInt(userFeatureIndex, 10) < featureConfig[0].rolloutRate) ? true : false
      return {
        featureName: featureConfig[0].name,
        enabled: enabled,
        userId: this.userId
      }
    } catch(err) {
      logger.error(`Failed to fetch feature config: ${err}`)
    }
  }

  queryAllFeatures() {
    try {
      const featureFlagResultsMap = []
      this.config.features.map(feature => {
        const featureFlagData = this.queryFeature(feature.name)
        featureFlagResultsMap.push(featureFlagData)
      })
      return featureFlagResultsMap
    } catch(err) {
      logger.error(`Failed to fetch feature config: ${err}`)
    }
  }

}

exports.FeatureFlagClient = FeatureFlagClient
