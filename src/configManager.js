const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const util = require('util')
const YAML = require('yamljs')
const { ScreepsAPI } = require('screeps-api')

const readFileAsync = util.promisify(fs.readFile)

class ConfigManager {
  constructor (context) {
    context.globalState.update('configManager', this)
  }
  async refresh() {
    this._config = null
    await this.getConfig()
  }
  async getServers() {
    const conf = await this.getConfig()
    console.log(conf)
    return Object.keys(conf.servers)
  }
  async getAPI(server) {
    const conf = await this.getConfig()
    return ScreepsAPI.fromConfig(server)
  }
  async getShards(server) {
    const api = await this.getAPI(server)
    const { serverData: { shards = ['shard0'] } = {} } = await api.version()
    return shards
  }
  async getConfig() { 
    if (this._config) {
      return this._config
    }
    const paths = []
    if (process.env.SCREEPS_CONFIG) {
      paths.push(process.env.SCREEPS_CONFIG)
    }
    const dirs = vscode.workspace.workspaceFolders || []
    for (const dir of dirs) {
      paths.push(path.join(dir, '.screeps.yaml'))
      paths.push(path.join(dir, '.screeps.yml'))
    }
    if (process.platform === 'win32') {
      paths.push(path.join(process.env.APPDATA, 'screeps/config.yaml'))
      paths.push(path.join(process.env.APPDATA, 'screeps/config.yml'))
    } else {
      if (process.env.XDG_CONFIG_PATH) {
        paths.push(path.join(process.env.XDG_CONFIG_HOME, 'screeps/config.yaml'))
        paths.push(path.join(process.env.XDG_CONFIG_HOME, 'screeps/config.yml'))
      }
      if (process.env.HOME) {
        paths.push(path.join(process.env.HOME, '.config/screeps/config.yaml'))
        paths.push(path.join(process.env.HOME, '.config/screeps/config.yml'))
        paths.push(path.join(process.env.HOME, '.screeps.yaml'))
        paths.push(path.join(process.env.HOME, '.screeps.yml'))
      }
    }
    for (const path of paths) {
      const data = await this.loadConfig(path)
      if (data) {
        if (!data.servers) {
          throw new Error(`Invalid config: 'servers' object does not exist in '${path}'`)
        }
        this._config = data
        return data
      }
    }
    return null
  }
  async loadConfig(file) {
    try {
      const contents = await readFileAsync(file, 'utf8')
      return YAML.parse(contents)
    } catch (e) {
      if (e.code === 'ENOENT') {
        return false
      } else {
        throw e
      }
    }
  }
}
module.exports = { ConfigManager }