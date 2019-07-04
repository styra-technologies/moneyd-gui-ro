const Index = require('./controllers/index')
const Graph = require('./controllers/graph')
const Errors = require('./controllers/errors')
const PubSub = require('./lib/pubsub')
const Koa = require('koa')
const Router = require('koa-router')
const Parser = require('koa-bodyparser')
const Views = require('koa-views')
const path = require('path')
const Riverpig = require('riverpig')

class App {
  constructor (deps) {
    this.index = deps(Index)
    this.errors = deps(Errors)
    this.pubsub = deps(PubSub)
    this.graph = deps(Graph)

    this.logger = Riverpig('moneyd-gui')
    this.router = Router()
    this.parser = Parser()

    this.views = Views(path.resolve(__dirname, '../views'), {
      extension: 'pug'
    })

    this.app = new Koa()
  }

  async listen () {
    await this.errors.init(this.app)

    this.logger.info('creating app')
    const server = this.app
      .use(this.parser)
      .use(this.views)
      .use(this.router.routes())
      .use(this.router.allowedMethods())
      .listen(process.env.PORT || 7770, '127.0.0.1')
    this.logger.info('listening on :' + (process.env.PORT || 7770))

    this.logger.info('attaching endpoints and connecting to moneyd...')
    await this.pubsub.init(server)
    await this.index.init(this.router)
    await this.graph.init(this.router)
    this.logger.info('moneyd-gui ready (republic attitude)')
  }
}

module.exports = App
