(function(root) {
	var TAG = '[signText] ';
	
	if (typeof root.crypto === 'undefined') {
		root.crypto = {};
	}

	if (typeof root.crypto.signText !== 'undefined') {
		return;
	}

	var xhr;

	function request(method, url, data) {
		try {
			if (!xhr) {
				xhr = new XMLHttpRequest;

				if (!xhr) {
					return false;
				}
			}

			// crypto.signText() is blocking, so this must be blocking as well
			xhr.open(method, url, false);
			
			if (data) {
				xhr.setRequestHeader('Content-Type', 'application/json');
			}
			
			xhr.send(JSON.stringify(data));

			if (xhr.status !== 200) {
				console.error(TAG + 'Request "' + url + '" Error (HTTP Status code: ' + xhr.status + ')');
				return false;
			}

			console.log(TAG + 'Request "' + url + '" OK');
			
			return JSON.parse(xhr.responseText);
		}
		catch (e) {
			return false;
		}
	}

	function detectFeatures(json, features) {
		var i, tmp1, tmp2;
		
		for (i in features) {
			if (features.hasOwnProperty(i)) {
				if (!json[i]) {
					throw new Error('Missing required key in version response');
				}
				if (typeof json[i] === "boolean" && json[i] !== features[i]) {
					throw new Error('Invalid required boolean value');
				}
				if (typeof json[i] === 'string') {
					tmp1 = json[i].split(',').map(function (v) {
						return v.trim();
					});
					tmp2 = features[i].split(',').map(function (v) {
						return v.trim();
					});
					tmp2.forEach(function (v) {
						if (tmp1.indexOf(v) === -1) {
							throw new Error('Missing required array item');
						}
					});
				}
			}
		}
	}

	// https://docs.oracle.com/cd/E19957-01/816-6152-10/sgntxt.htm
	function signText(stringToSign) {
		console.info(TAG + 'Starting');

		var baseUrl = 'http://127.0.0.1:8090';
		
		// Version request
		var versionResponse = request('GET', baseUrl + '/version');

		if (versionResponse === false) {
			// TODO: start LSF and tell user to retry
			console.error(TAG + 'LSF not found');
			alert('Please start LSF before signing!');
			return 'error:internalError';
		}

		//console.log(versionResponse);
		
		if (
			versionResponse.version === undefined ||
			versionResponse.httpMethods === undefined ||
			versionResponse.contentTypes === undefined ||
			versionResponse.signatureTypes === undefined ||
			versionResponse.selectorAvailable === undefined ||
			versionResponse.hashAlgorithms === undefined
		) {
			console.error(TAG + 'Invalid SCS version response');
			return 'error:internalError';
		}
		
		try {
			// TODO
			//detectFeatures(versionResponse, {});
		}
		catch (e) {
			console.error(TAG + 'Feature detection error: ' + e.message);
			return 'error:internalError';
		}

		// Signing request
		var signResponse = request('POST', baseUrl + '/sign', {
			'content': btoa(stringToSign)
		});
		
		//console.log(signResponse);
		
		if (
			signResponse.errorCode === undefined ||
			signResponse.reasonCode === undefined ||
			signResponse.signature === undefined ||
			signResponse.signatureAlgorithm === undefined ||
			signResponse.signatureType === undefined
		) {
			console.error(TAG + 'Invalid SCS sign response');
			return 'error:internalError';
		}
		
		if (signResponse.errorCode !== 0) {
			if (signResponse.errorCode === 1) {
				console.info(TAG + 'Operation cancelled by user');
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
		
		console.info(TAG + signResponse.reasonText);
		console.info(TAG + 'Completed');

		return signResponse.signature;
	}

	// EXPORT
	root.crypto.signText = signText;
})(window);
