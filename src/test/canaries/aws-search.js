const { info, getPage, screenshot } = require('./util/runtime')
const { Params } = require('./util/params')


async function runTests() {
  const page = await getPage()
  await testAwsSearch(page)
}

async function testAwsSearch(page) {
  /* Example using SSM Parameter Store:
   *
   *   const params = {
   *     searchHome:  await Params.get('searchHome'),
   *     searchQuery: await Params.get('searchQuery'),
   *   }
   */

  // For demo only. These would be obtained dynamically (env vars, Paramater Store, etc)
  const params = {
    searchHome:  'https://aws.amazon.com/search/',
    searchQuery: 'cloudwatch synthetics',
  }

  info('opening AWS search home...')
  await page.goto(params.searchHome)
  const searchBox = await page.waitForSelector('#awsm-search-form input[type=text]', { visible: true })
  info('at search home', page.url())
  await screenshot(page, 'search', 'home')

  info('running search...')
  await searchBox.type(params.searchQuery)
  await page.keyboard.press('Enter')
  await page.waitForSelector('#aws-search-result .lb-search-items', { visible: true })
  info('at search results')
  await screenshot(page, 'search', 'results')
}

exports.handler = runTests
