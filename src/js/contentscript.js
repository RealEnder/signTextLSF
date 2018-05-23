var s = document.createElement('script');
s.src = browser.extension.getURL('dist/js/script.js');
s.addEventListener('load', function() {
	this.parentNode.removeChild(this);
}, false);
const style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = browser.extension.getURL('dist/css/signtext-modal.css');
(document.head || document.documentElement).appendChild(s);
(document.head || document.documentElement).appendChild(style);

window.addEventListener('message', function (e) {
	if (e.source == window && e.data && e.data.badge) {
		browser.runtime.sendMessage(e.data);
	}
})