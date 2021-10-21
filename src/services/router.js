const express = require('express')
const fs = require('fs')
const cors = require('cors')

const router = express()
const port = process.env.PORT || 80

function run() {
  init()
  router.listen(port)
}

function init() {
  router.use(cors({ origin: true }))
  router.use(express.urlencoded({ extended: true }))

  setRoutes()
}

function setRoutes() {
  fs.readdirSync(srcPath('routes')).forEach(route => { setRoute(route) })
}

function setRoute(routeName) {
  const route = rootRequire(`routes/${routeName}`)
  router[route.httpMethod](`/${route.name}`, routeCallbacks(route), route.action)
}

function routeCallbacks(route) {
  const callbacks = []

  switch (true) {
    case route.jsonPayloadParsing:
      callbacks.push(express.json())
      break
    case route.rawPayloadParsing:
      callbacks.push(express.raw(route.payloadParserOptions))
      break
  }

  return route.callbacks ? [...callbacks, ...route.callbacks] : callbacks
}

module.exports = {
  run
}
