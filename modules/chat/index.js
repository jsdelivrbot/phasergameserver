const ChatManager = require("./ChatManager");
const ChatChanel = require("./ChatChanel");

module.exports = {
	ChatManager,
	ChatChanel,
	chat: ChatManager.inst,
	chatManager: ChatManager.inst,
};
