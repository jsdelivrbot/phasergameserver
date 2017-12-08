const colors = require("colors");

//set the log colors
colors.setTheme({
	success: "green", //[33m
	info: "cyan", //[36m
	warn: "yellow", //[33m
	error: "red" //[31m
});

module.exports.timelog = console.__proto__.timeLog = (...args) => {
	let d = new Date();
	args.unshift(
		"[" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "]"
	);
	console.log(...args);
};
