const parsePath = require('./parse-path')
const setValue = require('./set-value')

function appendField (store, key, value) {
  const steps = parsePath(key)

  steps.reduce((context, step) => {
    return setValue(context, step, context[step.key], value)
  }, store)
}

module.exports = appendField
// exports.appendField = appendField