const Player = require("./Player");
const Admin = require("./Admin");
const PlayerManager = require("./PlayerManager");

module.exports = {
	Player,
	Admin,
	PlayerManager,
	playerManager: PlayerManager.inst,
};
