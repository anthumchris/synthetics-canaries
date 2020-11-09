/*  Dynamic Parameter Value Utilities
 *
 *  This module provides all dynamic runtime parameter values obtained from
 *  static values, environment variables, or AWS Systems Manager (SSM)
 *  Parameter Store. To ensure runtime reliability, all parameters defined here
 *  must also be defined an available in their respective locations, otherwise
 *  an Error is thrown.
 *
 *  To configure credentials for the aws-sdk, please see https://amzn.to/35RxhVU
 */


const { debug, info, error } = require('./runtime')
const AWS = require('aws-sdk')

// these are async populated and returned
let initilizedValues = null

// Start defining parameters here. Use values or functions
const params = {
  searchHome:  async () => {
    // this example demonstrates dynamic params that resolved during runtime
    info('getting searchHome value...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    return 'https://aws.amazon.com/search/'
  },
  searchQuery: 'cloudwatch synthetics',
}


/*  Define SSM Parameter Store names and the local values they'll be mapped to.
 *  Use format: <REMOTE_NAME>: <LOCAL_EXPORTED_NAME>
 *
 *     const ssmParamNameMap = {
 *       '/my-webapp-name/username': 'user',
 *       '/my-webapp-name/password': 'pass',
 *     }
 */
const ssmParamNameMap = {}


const Params = {
  get: async (name) => {
    if (!initilizedValues) {
      initilizedValues = initValues()
    }
    const values = await initilizedValues

    // this requirement can be optional, depending on your app
    if (!values.hasOwnProperty(name))
      throw Error('Invalid parameter name: '+name)

    let value = values[name]

    // if value is a function, swap it with the return value
    if ('function' === typeof value) {
      values[name] = value.call(values)
      value = await values[name]
    }

    return value
  }
}


function initValues() {
  return new Promise(async (resolve, reject) => {
    try {
      const ssmValues = await fetchSsmParams()
      resolve(Object.assign({}, ssmValues, params))
    } catch (e) {
      reject(e)
    }
  })
}


// Fetch defined param names from SSM Parameter Store.  Throw error if any do not exist
async function fetchSsmParams() {
  const remoteNames = Object.keys(ssmParamNameMap)
  if (!remoteNames.length) {
    return {}
  }

  // API limits 10 per request. Refactor with multiple API paging requests if needed
  if (remoteNames.length > 10)
    throw Error('SSM Parameters exceed maximum allowed (code refactor needed).')
  
  info('fetching values from Parameter Store...')
  const ssm = new AWS.SSM()
  const reqParams = {
    Names: remoteNames,
    WithDecryption: true,
  }
  const response = await ssm.getParameters(reqParams).promise()
  const invalidParams = response.InvalidParameters
  if (invalidParams.length) {
    const msg = 'required params do not exist in SSM Parameter Store'
    throw Error(`${msg}: [\n  ${invalidParams.join('\n  ')}\n]`)
  }

  response.Parameters.forEach(({ Name, Value }) => {
    // If needed, convert multi-line values to arrays here
    params[ ssmParamNameMap[Name] ] = arrayFromLines(Value)
  })
}


// returns array of values that are separated by line breaks (unix only). Ignore blanks
function arrayFromLines(str) {
  return str.split('\n').map(s => s.trim()).filter(s => s !== '')
}


module.exports = {
  Params,
}
