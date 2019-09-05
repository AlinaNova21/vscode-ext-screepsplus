// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { ServersView } = require('./serversView')
const { ConfigManager } = require('./configManager')
const { ScreepsAPI } = require('screeps-api')
const fs = require('fs')
const path = require('path')
const util = require('util')

const mkdirAsync = util.promisify(fs.mkdir)
const writeFileAsync = util.promisify(fs.writeFile)
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "screepsplus" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
	
	const cm = new ConfigManager(context)
	context.subscriptions.push(vscode.commands.registerCommand('screepsplus.viewMemory', async (server, shard, pth = '') => {
		if (!server) {
			server = await vscode.window.showQuickPick(cm.getServers())
		}
		if (!shard) {
			shard = await vscode.window.showQuickPick(cm.getShards(server))
		}
		try {
			const api = await cm.getAPI(server)
			let { data } = await api.memory.get(pth, shard)
			if (typeof data === 'string' && data.startsWith('gz:')) {
				data = await api.gz(data)
			}
			const file = path.join(context.globalStoragePath, server, shard, 'memory.json')
			try {
				await mkdirAsync(path.dirname(file), { recursive: true })
			} catch(e) {}
			await writeFileAsync(file, JSON.stringify(data, null, 2))
			const setting = vscode.Uri.parse(`file:${file}`)
			const doc = await vscode.workspace.openTextDocument(setting)
			const editor = await vscode.window.showTextDocument(doc, 1, false)
		} catch (e) {
			console.error(e)
		}
	}))
	context.subscriptions.push(vscode.commands.registerCommand('screepsplus.viewSegment', async (server, shard, segment) => {
		if (!server) {
			server = await vscode.window.showQuickPick(cm.getServers(), {
				placeHolder: 'server'
			})
			if (!server) return
		}
		if (!shard) {
			shard = await vscode.window.showQuickPick(cm.getShards(server), {
				placeHolder: 'shard'
			})
			if (!shard) return
		}
		if (typeof segment === 'undefined') {
			segment = await vscode.window.showInputBox({ 
				prompt: 'Please enter a segment number:'
			})
			if (!segment) return
		}
		try {
			const api = await cm.getAPI(server)
			const { data } = await api.segment.get(segment, shard)
			const file = path.join(context.globalStoragePath, server, shard, '' + segment)
			try {
				await mkdirAsync(path.dirname(file), { recursive: true })
			} catch(e) {}
			await writeFileAsync(file, data)
			const setting = vscode.Uri.parse(`file:${file}`)
			const doc = await vscode.workspace.openTextDocument(setting)
			const editor = await vscode.window.showTextDocument(doc, 1, false)
			// const edit = editor.edit(edit => {
			// 	edit.insert(new vscode.Position(0, 0), data)
			// })
		} catch (e) {
			console.error(e)
		}
	}))
	new ServersView(context)
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
