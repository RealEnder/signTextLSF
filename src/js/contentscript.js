// Entry point for the extension

// Main script of the extension
var s = document.createElement('script');
s.src = browser.extension.getURL('dist/js/script.js');
s.addEventListener('load', function() {
	this.parentNode.removeChild(this);
}, false);

// Styles for modal info box
var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = browser.extension.getURL('dist/css/signtext-modal.css');

// Attaching main script
(document.head || document.documentElement).appendChild(s);

// Attaching modal box styles
(document.head || document.documentElement).appendChild(style);

// Listener for sending messages to background script
window.addEventListener('message', function (e) {
	if (e.source == window && e.data && e.data.badge) {
		browser.runtime.sendMessage(e.data);
	}
})