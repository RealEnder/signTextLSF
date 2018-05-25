// Icon badge showing LSF status

// Setting badge text and background
// depending on LSF status
function set_badge(text, color) {
    text = text || ' ';
    color = color || 'red';
    browser.browserAction.setBadgeText({
        text: color === 'red' ? 'n/a' : 'ok'
    });

    browser.browserAction.setBadgeBackgroundColor({
        'color': color
    });
}

// Adding listener for communication with extension script
browser.runtime.onMessage.addListener(listeners);

// Listener for communication with extension script
function listeners(message) {
    if (message.badge) {
        set_badge(' ', message.color);
    }
}
