const vscode = require('vscode');

class ServersView {
  constructor(context) {
    const configManager = context.globalState.get('configManager')
    const view = vscode.window.createTreeView('serversView', {
      treeDataProvider: treeDataProvider(configManager),
      showCollapseAll: true
    })
  }
}

function treeDataProvider(configManager) {
  return {
    _onDidChangeTreeData: new vscode.EventEmitter(),
    get onDidChangeTreeData() {
      return this._onDidChangeTreeData.event
    },
    refresh() {
      this._onDidChangeTreeData.fire()
    },
    getChildren: async (element) => {
      if (element) {
        switch (element.type) {
          case 'server':
            const shards = await configManager.getShards(element.server)
            return shards.map(shard => ({
              type: 'shard',
              shard,
              server: element.server
            }))
          case 'shard':
            return ['memory', 'segments'].map(type => ({ type, shard: element.shard, server: element.server }))
          case 'segments':
            const ret = []
            for (let i = 0; i < 100; i++) {
              ret.push({
                type: 'segment',
                segment: i,
                server: element.server,
                shard: element.shard
              })
            }
            return ret
        }
      }
      const servers = await configManager.getServers()
      return servers.map(server => ({ type: 'server', server }))
    },
    getTreeItem: (element) => {
      const { type, server, shard, segment } = element
      switch (type) {
        case 'server':
          return {
            id: server,
            label: server,
            tooltip: server,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
          }
        case 'shard': {
          return {
            id: `${server}-shard-${shard}`,
            label: shard,
            tooltip: `Shard ${shard}`,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
          }
        }
        case 'memory': {
          return {
            id: `${server}-${shard}-memory`,
            label: 'Memory',
            tooltip: 'Memory',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command: {
              title: 'View Memory',
              command: 'screepsplus.viewMemory',
              arguments: [server, shard]
            }
          }
        }
        case 'segments': {
          return {
            id: `${server}-${shard}-segments`,
            label: 'Segments',
            tooltip: 'Segments',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
          }
        }
        case 'segment': {
          return {
            id: `${server}-${shard}-segment-${segment}`,
            label: `#${segment}`,
            tooltip: `Segment #${segment}`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command: {
              title: 'View Segment',
              command: 'screepsplus.viewSegment',
              arguments: [server, shard, segment]
            }
          }
        }
      }
    },
    getParent: ({ key }) => {
      return null
    }
  }
}

function getNode(key) {
  if (!nodes[key]) {
    nodes[key] = new Key(key)
  }
  return nodes[key]
}


module.exports = { ServersView }