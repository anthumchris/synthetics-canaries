/*  AWS Systems Manager (SSM) Parameter Store Utilities
 *
 *  This module provides utilities for fetching values from an SSM Parameter
 *  Store. To ensure runtime reliability, all parameters defined here must also
 *  be defined in the Parameter Store, otherwise an Error is thrown.
 *
 *  To configure credentials for the aws-sdk, please see https://amzn.to/35RxhVU
 */


const { info, error } = require('./runtime')
const AWS = require('aws-sdk')
const ssm = new AWS.SSM()


/*  Define SSM Parameter Store names and the local values they'll be mapped to.
 *  Use format: <REMOTE_NAME>: <LOCAL_EXPORTED_NAME>
 *
 *     const paramNameMap = {
 *       '/my-webapp-name/username': 'user',
 *       '/my-webapp-name/password': 'pass',
 *     }
 */
const paramNameMap = {}


// Waits until first param is requested to fetch from SSM Parameter Store
const fetchParams = (() => {
  let fetchPromise = null

  return () => {
    if (!fetchPromise) {
      info('fetching values from Parameter Store...')

      const remoteNames = Object.keys(paramNameMap)
      if (!remoteNames.length) {
        return Promise.resolve([])
      }

      // API limits 10 per request. Refactor with multiple API requests if needed
      if (remoteNames.length > 10)
        throw Error('Parameters exceed maximum allowed (code refactor needed.')
      
      fetchPromise = new Promise(async (resolve, reject) => {
        const reqParams = {
          Names: remoteNames,
          WithDecryption: true,
        }
        const response = await ssm.getParameters(reqParams).promise()
        const invalidParams = response.InvalidParameters
        if (invalidParams.length) {
          const msg = 'required params do not exist in SSM Parameter Store'
          error(msg, invalidParams)
          throw Error(msg)
        }

        const params = {}
        response.Parameters.forEach(({ Name, Value }) => {
          params[ paramNameMap[Name] ] = Value
        })

        // If needed, convert multi-line values to arrays here
        // params.exampleValue = arrayFromLines(params.exampleValue)

        resolve(params)
      })
    }

    return fetchPromise
  }
})()


const Params = {
  get: async (name) => {
    const params = await fetchParams()

    // this requirement can be optional, depending on your app
    if (!params.hasOwnProperty(name))
      throw Error('Invalid parameter name: '+name)

    return params[name]
  }
}


// returns array of values that are separated by line breaks (unix only). Ignore blanks
function arrayFromLines(str) {
  return str.split('\n').map(s => s.trim()).filter(s => s !== '')
}


module.exports = {
  Params,
}
