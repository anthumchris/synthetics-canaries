const tests = [
  'aws-search'
];

(async function() {
  await Promise.all(tests.map(async test => {
    console.log(':: RUNNING', test)
    const { handler } = require (`./canaries/${test}`)
    await handler()
    console.log(':: COMPLETED', test)
  }))
  process.exit(0)
})()


