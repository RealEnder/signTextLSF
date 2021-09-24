// Main script of the signTextLSF extension

// Importing required functions
import * as base64js from 'base64-js';
import { stringToUtf8ByteArray } from 'utf8-string-bytes';

// Initializing extension
(function (root) {

	const TAG = '[signText] ';

	// Modal info box HTML
	const modal_html = `<div class="sign_text_popup_modal signtext_popup_modal__fade">
    <div class="signtext_popup_modal__content">
      <div class="signtext_popup_modal__header">
        <h1 class="title">SignText LSF</h1>
      </div>
      <div class="signtext_popup_modal__body">
        <div class="signtext__error">
          <p class="danger">Connection error occurred.</p>
        </div>
        <p>Please check if signTextLSFSHA256.jnlp is up and running.</p>
        <div class="signtext__toggle">
          <div class="signtext__toggle__header">
            <p>I do not have signTextLSFSHA256.jnlp.</p>
          </div>
          <div class="signtext__toggle__body">
            <p>Download <a href="https://sign.uslugi.io/java/signTextLSFSHA256.jnlp" download="signTextLSFSHA256.jnlp">signTextLSFSHA256.jnlp</a> and start it.
            </p>
            <p>Refresh current page.</p>
          </div>
        </div>
        <div class="signtext__toggle">
          <div class="signtext__toggle__header">I have started signTextLSF, but still experiencing an error.</div>
          <div class="signtext__toggle__body">
            <p>Description about site CSP.</p>
          </div>
        </div>
      </div>
      <br />
      <div class="signtext_popup_modal__footer">
        <button type="button" class="signtext_popup_modal__button signtext_popup_modal__button--close">Close</button>
      </div>
    </div>
  </div>`;


  // Showing information and download link
  // if LSF is not present
  function create_and_show_modal() {

    const modal_exists = document.querySelector('.sign_text_popup_modal');
    if (modal_exists) return true;
    const modal = document.createElement('div');
    modal.classList.add('popup_modal');
    modal.innerHTML = modal_html;
    document.body.appendChild(modal);

    const button_close = modal.querySelector('.signtext_popup_modal__button.signtext_popup_modal__button--close');
    !!button_close && button_close.addEventListener('click', () => modal.parentNode.removeChild(modal), false);
    Array.from(document.querySelectorAll('.signtext__toggle__header'))
    .map(a => a.addEventListener('click', e=>e.currentTarget.parentNode.classList.toggle('open')))

  }

  // Setting icon badge
  // color: background color of the badge
  function set_badge(color) {

    const badge = {
      badge : true,
      color : color || 'green',
    };
    window.postMessage(badge, '*');

  }

  // Possible URLs for LSF
  const array_url = [
    'http://127.0.0.1:8090',
    'https://127.0.0.1:8089',

    'http://127.0.0.1:23125',
    'https://127.0.0.1:23124',

    'http://127.0.0.1:53953',
    'https://127.0.0.1:53952'
	];

  // URL on witch LSF is listening
  let base_url = '';

  // Setting base_url
  // response_json: response of the version method of LSF
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

  // Requests possible URLs for Version response
  // options: object with control properties
  function find_base_url(options = {}) {

    array_url.forEach((url, index) => {
      options.callback_success = set_base_url.bind({url : url});
      if (!options.async && !!base_url) {
        console.log(`FOUND base_url - no xhr request ${url} `, url);
      }
      else xhr_request('get', url + '/version', undefined, options);
    });

  }

  // Parsing Version response and
  // checking if the answer is from LSF
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

  // HTTP Requester, implementing XMLHttpRequest
  // method: http method
  // url: request url
  // data: payload to be sent
  // options: object with control properties
  function xhr_request(method, url, data, options) {

    const is_async = options.async === undefined ? true : options.async;
    const callback_success = options.callback_success || false;
    const callback_end = options.callback_end || false;
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, is_async);
      if (data) {
        const isFirefox = (navigator.userAgent.indexOf('Firefox/') > -1);
        if (!isFirefox) xhr.setRequestHeader('Content-Type', 'application/json');
      }
      if (is_async && !!callback_success) {
        xhr.onload = function(success) {
          console.log('success', url);
          const response_json = JSON.parse(xhr.responseText);
          if (typeof callback_success === 'function') callback_success(response_json);
        }
      }
      if (is_async && !!callback_end) {
        xhr.addEventListener('loadend', function() {
          if (typeof end_callback === 'function') end_callback();
        });
      }
      xhr.onerror = function(error) {
        console.log('error', url);
        console.warn(error);
      }
      xhr.send(JSON.stringify(data));
      if (!is_async) {
        const response_json = JSON.parse(xhr.responseText);
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

  // Creating modal and setting badge if LSF not found
  function url_not_found() {

    create_and_show_modal();
    set_badge('red');
    console.error(TAG + 'LSF not found');
    //alert('Please start LSF before signing!');
    return 'error:internalError';

  }

    // https://docs.oracle.com/cd/E19957-01/816-6152-10/sgntxt.htm
	// Implementation of Netscape's crypto.signText() using LSF
	// stringToSign: text to be signed
	function signText(stringToSign) {

    if (!stringToSign) return 'error:internalError';
		console.info(TAG + 'Extension code starting');
    if (!base_url) find_base_url({async : false});
    if (!base_url) return url_not_found();
		console.info(TAG + 'Requesting signature');

		// Signing request
		const stringBytes = stringToUtf8ByteArray(stringToSign);
    const sign_data = {
      'content': base64js.fromByteArray(stringBytes)
    };
    const sign_options = {
      async : false
    };
    const signResponse = xhr_request('post', base_url + '/sign', sign_data, sign_options);

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
			console.error(TAG + 'Error in operation, reasonCode=' + signResponse.errorCode);
			return 'error:internalError';
		}

		if (
			signResponse.signatureType !== 'signature' ||
            ['SHA1withRSA', 'Sha256WithRSA'].indexOf(signResponse.signatureAlgorithm) === -1
		) {
			console.error(TAG + 'Error in operation, got wrong type or algorithm (' +
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
