import * as base64js from 'base64-js';
import { stringToUtf8ByteArray } from 'utf8-string-bytes';

(function (root) {

	const TAG = '[signText] ';
	const modal_html = `<div class="signtext_popup_modal__fade">
			<div class="signtext_popup_modal__content">
			<div class="signtext_popup_modal__header">
				<h1 class="title">SignText LSF</h1>
			</div>
			<div class="signtext_popup_modal__body">
				<p>Please start signTextLSF.jnlp. If you don't have it, follow the link below.</p>
				<br />
				<a href="https://sign.uslugi.io/java/signTextLSF.jnlp" download="signTextLSF.jnlp">Download signTextLSF.jnlp</a>
			</div>
			<br />
			<div class="signtext_popup_modal__footer">
				<button type="button" class="signtext_popup_modal__button signtext_popup_modal__button--close">Close</button>
			</div>
			</div>
		</div>`;


  function create_and_show_modal() {

    var modal = document.createElement('div');
    modal.classList.add('popup_modal');
    modal.innerHTML = modal_html;
    document.body.appendChild(modal);

    var button_close = modal.querySelector('.signtext_popup_modal__button.signtext_popup_modal__button--close');
    !!button_close && button_close.addEventListener('click', function(){
      modal.parentNode.removeChild(modal);
    }, false);

  }

  function set_badge(color) {

    var badge = {
      badge : true,
      color : color || 'green',
    };
    window.postMessage(badge, '*');

  }

  var array_url = [
    'http://127.0.0.1:8090',
    'https://127.0.0.1:8089',

    'http://127.0.0.1:23125',
    'https://127.0.0.1:23124',

    'http://127.0.0.1:53953',
    'https://127.0.0.1:53952'
  ];
  var base_url = '';

  function set_base_url(response_json) {

    if (!!base_url) return true;
    console.log('CHECK Version response');
    if (check_version_response(response_json)) {
      console.log('VALID Version respose');
      if (!!this.url) {
        base_url = this.url;
        console.log('SET base_url');
        set_badge('green');
      }
    }

  }

  function find_base_url(options = {}) {

    array_url.forEach((url, index) => {
      options.callback_success = set_base_url.bind({url : url});
      if (!options.async && !!base_url) {
        console.log(`FOUND base_url - no xhr request ${url} `, url);
      }
      else xhr_request('get', url + '/version', undefined, options);
    });

  }

  function check_version_response(json) {

    if (json.version === undefined ||
        json.httpMethods === undefined ||
        json.contentTypes === undefined ||
        json.signatureTypes === undefined ||
        json.selectorAvailable === undefined ||
        json.hashAlgorithms === undefined
        ) return false;
    return true;

  }

  function xhr_request(method, url, data, options) {

    var async = options.async === undefined ? true : options.async;
    var callback_success = options.callback_success || false;
    var callback_end = options.callback_end || false;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, async);
      if (data) {
        var isFirefox = (navigator.userAgent.indexOf('Firefox/') > -1);
        if (!isFirefox) xhr.setRequestHeader('Content-Type', 'application/json');
      }
      if (async && !!callback_success) {
        xhr.onload = function(success) {
          console.log('success', url);
          var response_json = JSON.parse(xhr.responseText);
          if (typeof callback_success === 'function') callback_success(response_json);
        }
      }
      if (async && !!callback_end) {
        xhr.addEventListener('loadend', function() {
          if (typeof end_callback === 'function') end_callback();
        });
      }
      xhr.onerror = function(error) {
        console.log('error', url);
        console.warn(error);
      }
      xhr.send(JSON.stringify(data));
      if (!async) {
        var response_json = JSON.parse(xhr.responseText);
        if (typeof callback_success === 'function') callback_success(response_json);
        return response_json;
      }
    }
    catch(error) {
      console.error('Error xhr');
      console.error(error);
      return false;
    }

  }


  function url_not_found() {

    create_and_show_modal();
    set_badge('red');
    console.error(TAG + 'LSF not found');
    //alert('Please start LSF before signing!');
    return 'error:internalError';

  }
  // https://docs.oracle.com/cd/E19957-01/816-6152-10/sgntxt.htm


	function signText(stringToSign) {

		console.info(TAG + 'Extension code starting');
    if (!base_url) find_base_url({async : false});
    if (!base_url) return url_not_found();
		console.info(TAG + 'Requesting signature');

		// Signing request
		const stringBytes = stringToUtf8ByteArray(stringToSign);
    var sign_data = {
      'content': base64js.fromByteArray(stringBytes)
    };
    var sign_options = {
      async : false
    };
    var signResponse = xhr_request('post', base_url + '/sign', sign_data, sign_options);

		console.info(TAG + 'Signature response received');
		// console.log(signResponse);
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


  /* INIT */

  set_badge('red');

  find_base_url({
    async : true
  });

  if (typeof root.crypto === 'undefined') {
   console.warn(TAG + 'crypto is not defined - not a browser?');
   root.crypto = {};
  }

  if (typeof root.crypto.signText !== 'undefined') {
   console.warn(TAG + 'crypto.signText already defined - exiting');
   return;
  }


  /* EXPORT */

	root.crypto.signText = signText;

})(window);
