const execSync = require('child_process').execSync;
const wdio = require('webdriverio');

const hideKeyboard = async (port) => {
    const browser = await wdio.remote({
        hostname: 'localhost',
        port,
        path: '/wd/hub',
        capabilities: {
            platformName: 'iOS',
            automationName: 'XCUITest',
            // deviceName: 'iPhone 11',
            connectHardwareKeyboard: true,
            version: '13.0',
            browserName: 'safari',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1'
        }
    });

    browser.setAsyncTimeout(5000);

    await browser.executeAsync(function(done) {
        setTimeout(() => {
            const input = document.createElement('input');
            input.setAttribute('type', 'text');

            document.body.append(input);
            input.focus();
            done();
        }, 1000);
    });
    console.log('I AM HERE');
    execSync(`open -a Simulator && sleep 1`);
};

module.exports = async function(p) {
    return hideKeyboard(p);
};
