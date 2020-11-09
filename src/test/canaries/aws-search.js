const { info, getPage, screenshot } = require('./util/runtime')
const { Params } = require('./util/params')


async function runTests() {
  const page = await getPage()
  await testAwsSearch(page)
}

async function testAwsSearch(page) {
  const [searchHome, searchQuery] = await Promise.all([
    Params.get('searchHome'),
    Params.get('searchQuery'),
  ])

  info('opening AWS search home...')
  await page.goto(searchHome)
  const searchBox = await page.waitForSelector('#awsm-search-form input[type=text]', { visible: true })
  info('at search home', page.url())
  await screenshot(page, 'search', 'home')

  info('running search...')
  await searchBox.type(searchQuery)
  await page.keyboard.press('Enter')
  await page.waitForSelector('#aws-search-result .lb-search-items', { visible: true })
  info('at search results')
  await screenshot(page, 'search', 'results')
}

exports.handler = runTests
