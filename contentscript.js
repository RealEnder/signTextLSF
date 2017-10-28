var s = document.createElement('script');
s.src = chrome.extension.getURL('script.js');
s.addEventListener('load', function() {
	this.parentNode.removeChild(this);
}, false);
(document.head || document.documentElement).appendChild(s);
