(function (root) {
	var TAG = '[signText] ';
	var modal_html = 
		'<div class="signtext_popup_modal__fade">' +
			'<div class="signtext_popup_modal__content">' +
			'<div class="signtext_popup_modal__header">' +
				'<h1 class="title">SignText LSF</h1>' +
			'</div>' +
			'<div class="signtext_popup_modal__body">' +
				"<p>Please start signTextLSF.jnlp. If you don't have it, follow the link below.</p>" +
				'<br />' +
				'<a href="https://sign.uslugi.io/java/signTextLSF.jnlp" download="signTextLSF.jnlp">Download signTextLSF.jnlp</a>' +
			'</div>' +
			'<br />' +
			'<div class="signtext_popup_modal__footer">' +
				'<button type="button" class="signtext_popup_modal__button signtext_popup_modal__button--close">Close</button>' +
			'</div>' +
			'</div>' +
		'</div>';
	
	var baseUrl = null;
	setTimeout(function () {
		baseUrl = getBaseUrl();
	}, 100);

	if (typeof root.crypto === 'undefined') {
		console.warn(TAG + 'crypto is not defined - not a browser?');
		root.crypto = {};
	}

	if (typeof root.crypto.signText !== 'undefined') {
		console.warn(TAG + 'crypto.signText already defined - exiting');
		return;
	}
	
	var base64js = require('base64-js');
	var utf8StringBytes = require('utf8-string-bytes');

	function getBaseUrl() {
		var result = null;
		var baseUrls = [
			'http://127.0.0.1:8090',
			'https://127.0.0.1:8089',

			'http://127.0.0.1:23125',
			'https://127.0.0.1:23124',

			'http://127.0.0.1:53953',
			'https://127.0.0.1:53952'
		];

		var i;
		for (i = 0; i < baseUrls.length; ++i) {
			if (checkServer(baseUrls[i])) {
				result = baseUrls[i];
				break;
			}
		}

		var badge = {
			badge: true,
			color: 'green'
		};

		if (result === null) {
			badge.color = 'red';
		}
		
		window.postMessage(badge, '*');

		return result;
	}

	function request(method, url, data) {
		var TAG2 = TAG + '[' + method + ' ' + url + '] ';
		
		try {
			var xhr = new XMLHttpRequest;

			if (!xhr) {
				console.error(TAG2 + 'Failed to create a XMLHttpRequest object');
				return false;
			}

			// crypto.signText() is blocking, so this must be blocking as well
			xhr.open(method, url, false);
			
			if (data) {
				// Firefox does not support pre-flight OPTIONS requests from secure origin to 127.0.0.1
				// See https://bugzilla.mozilla.org/show_bug.cgi?id=1376310
				// Chrome and Opera support it
				// TODO: test in Edge
				var isFirefox = (navigator.userAgent.indexOf('Firefox/') > -1);
				
				if (!isFirefox) {
					xhr.setRequestHeader('Content-Type', 'application/json');
				}
			}
			
			xhr.send(JSON.stringify(data));

			if (xhr.status !== 200) {
				console.error(TAG2 + 'Unexpected HTTP status code ' + xhr.status);
				return false;
			}

			console.log(TAG2 + 'Request successful');
			
			return JSON.parse(xhr.responseText);
		}
		catch (e) {
			console.error(TAG2 + 'Exception during request');
			console.error(e);
			return false;
		}
	}

	function create_and_show_modal() {

		var modal = document.createElement('div');
		modal.classList.add('popup_modal');
		modal.innerHTML = modal_html;
		document.body.prepend(modal);
	  
		var button_close = modal.querySelector('.signtext_popup_modal__button.signtext_popup_modal__button--close');
		!!button_close && button_close.addEventListener('click', function(){
		  modal.parentNode.removeChild(modal);
		}, false);
	  
	  }

	function checkServer(baseUrl) {
		var TAG2 = TAG + '[' + baseUrl + '] ';
		
		console.info(TAG2 + 'Checking URL');
		
		// Version request
		var versionResponse = request('GET', baseUrl + '/version');

		if (versionResponse === false) {
			console.warn(TAG2 + 'Request error');
			return false;
		}
		
		console.info(TAG2 + 'Version response received');
		console.log(versionResponse);
		
		if (
			versionResponse.version === undefined ||
			versionResponse.httpMethods === undefined ||
			versionResponse.contentTypes === undefined ||
			versionResponse.signatureTypes === undefined ||
			versionResponse.selectorAvailable === undefined ||
			versionResponse.hashAlgorithms === undefined
		) {
			console.error(TAG2 + 'Version response is not valid');
			return false;
		}
		
		return true;
	}

	// https://docs.oracle.com/cd/E19957-01/816-6152-10/sgntxt.htm
	function signText(stringToSign) {
		console.info(TAG + 'Extension code starting');

		if (baseUrl === null) baseUrl = getBaseUrl();
		
		if (baseUrl === null) {
			create_and_show_modal();
			console.error(TAG + 'LSF not found');
			//alert('Please start LSF before signing!');
			return 'error:internalError';
		}

		console.info(TAG + 'Requesting signature');
		
		// Signing request
		var stringBytes = utf8StringBytes.stringToUtf8ByteArray(stringToSign);
		var signResponse = request('POST', baseUrl + '/sign', {
			'content': base64js.fromByteArray(stringBytes)
		});
		
		console.info(TAG + 'Signature response received');
		console.log(signResponse);
		
		if (
			signResponse.errorCode === undefined ||
			signResponse.reasonCode === undefined ||
			signResponse.signature === undefined ||
			signResponse.signatureAlgorithm === undefined ||
			signResponse.signatureType === undefined
		) {
			console.error(TAG + 'Signature response is not valid');
			return 'error:internalError';
		}
		
		if (signResponse.errorCode !== 0) {
			if (signResponse.errorCode === 1) {
				console.info(TAG + 'Signature operation cancelled by user');
				return 'error:userCancel';
			}
			
			console.error(TAG + 'Error in operation, errorCode=' + signResponse.errorCode);
			return 'error:internalError';
		}
		
		if (signResponse.reasonCode !== 200) {
			console.error(TAG + 'Error in operaton, reasonCode=' + signResponse.errorCode);
			return 'error:internalError';
		}

		if (
			signResponse.signatureType !== 'signature' ||
			signResponse.signatureAlgorithm !== 'SHA1withRSA'
		) {
			console.error(TAG + 'Error in operaton, got wrong type or algorithm (' +
				signResponse.signatureType + '/' + signResponse.signatureAlgorithm + ')');
			return 'error:internalError';
		}
		
		console.info(TAG + 'Signature successful, returning result to the browser');
		console.info(TAG + 'Extension code completed');

		return signResponse.signature;
	}

	// EXPORT
	root.crypto.signText = signText;
})(window);
