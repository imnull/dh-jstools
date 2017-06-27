const DHXTools = require('./dh-xtools.js');
const WidgetBB = DHXTools.WidgetBlackBox;

let box = WidgetBB.Create({ x: 0, y: 0, type: null }, (config) => {
	console.log(config)
});

box.set({ x: 1, y: 0 });
box.set({ x: 1, y: 1 });
box.set({ x: 1, y: 2 });
box.set({ x: 2, y: 2 });