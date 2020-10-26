/* Canary Runtime Environment (RTE) Utilities
 *
 * This module provides an abstraction layer for Canaries to run in both local
 * or CloudWatch Synthetics RTEs. For this to work, Canaries should not use
 * Synthetics objects directly and only use abstracted exports from here instead. 
 */


// use CloudWatch Synthetics Canary or mock objects if running locally
const synthetics = envRequire('Synthetics', null)
const logger = Logger(envRequire('SyntheticsLogger', console))
const isSyntheticsEnv = !!synthetics

// use local tmp or Synthetics/Lambda folder
const screenshotRoot = isSyntheticsEnv
  ? '/tmp'  // Synthetics only allows /tmp writes
  : (function() {
      const fs = require('fs')
      
      // find project root trying node_modules folders
      for (let path of (require.main || { paths: []}).paths) {
        if (fs.existsSync(path)) {
          // remove "/node_modules" at end
          path = path.substring(0, path.lastIndexOf('/'))
          fs.mkdirSync(path += '/tmp/screenshots', { recursive: true})
          return path
        }
      }
      return ''
    })()

let screenshotsTaken = 0 // used for filenames


// try require() or return localFallback
function envRequire(moduleIdPath, localFallback) {
  try { return require(moduleIdPath) } catch {}
  return localFallback
}


/* Mimics synthetics.takeScreenshot() with benefits:
 *   - char conversion '/' => '-' to prevent Synthetics error
 *   - '00n' filename padding used instead of 2 digit '0n''
 *   - page.screenshot() offers parallel captures for multiple
 *     pages simultaneously (not yet tested)
 *
 * Filenames created are "###-CATEGORY-VALUE.png", like:
 *   001.png
 *   002-login.png
 *   003-login-load.png
 *   004-login-error.png
 */
function screenshot(page, category='', value='') {
  // convert slashes
  const sanitize = (s) => s === null
    ? ''
    : s.trim().replace(/\//g, '-')

  category = sanitize(category)
  value = sanitize(value)

  // build filename
  const parts = [String(++screenshotsTaken).padStart(3, '0')]
  if (category !== '') parts.push(category)
  if (value !== '') parts.push(value)
  const filename = parts.join('-') + '.png'

  return page.screenshot({ path: `${screenshotRoot}/${filename}` })
}


// returns Promise<Puppeteer.Page>
const getPage = (function() {
  let browser

  function initBrowser() {
    const puppeteer = require('puppeteer')
    browser = puppeteer.launch({ 
      defaultViewport: {
        width: 1200,
        height: 800,
      },

      /* enable this for local development to watch tests */
      // headless: false,
    })
  }

  return isSyntheticsEnv
    ? synthetics.getPage.bind(synthetics)
    : async function() {
        if (!browser) initBrowser()
        return (await browser).newPage()
      }
})()


// create a logger based on identical functions for both NodeJS/SyntheticsLogger
function Logger(logger) {
  return {
    debug: logger.debug.bind(logger),
    info:  logger.info.bind(logger),
    log:   logger.log.bind(logger),
    warn:  logger.warn.bind(logger),
    error: logger.error.bind(logger),
  }
}


module.exports = {
  ...logger,
  getPage,
  screenshot,
}
