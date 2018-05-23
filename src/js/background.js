function set_badge(text, color) {
    text = text || ' ';
    color = color || 'red';

    browser.browserAction.setBadgeText({
        text: text
    });

    browser.browserAction.setBadgeBackgroundColor({
        'color': color
    });
}

browser.runtime.onMessage.addListener(listeners);

function listeners(message) {
    if (message.badge) {
        set_badge(' ', message.color);
    }
}