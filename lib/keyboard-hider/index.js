const execSync = require('child_process').execSync;
const path = require('path');
const ls = require('looks-same');
const wdio = require('webdriverio');
const Promise = require('bluebird');

// console.log(process.argv);
// console.log(__filename);
// console.log(__dirname);
const ports = [4444];
// const ports = [4444, 4445, 4446, 4447, 4448];

const keyboardSize = {
    WIDTH: 800,
    HEIGHT: 600
};

const hasKeyboard = (diffClusters = []) => {
    for (const cluster of diffClusters) {
        console.log('HERER');
        console.log(cluster.right - cluster.left);
        console.log(cluster.bottom - cluster.top);
        console.log(cluster.right - cluster.left > keyboardSize.WIDTH && cluster.bottom - cluster.top > keyboardSize.HEIGHT);
        if (cluster.right - cluster.left > keyboardSize.WIDTH && cluster.bottom - cluster.top > keyboardSize.HEIGHT) {
            return true;
        }
    }

    return false;
};

const hideKeyboard = async (port) => {
    const browser = await wdio.remote({
        hostname: 'localhost',
        port,
        path: '/wd/hub',
        capabilities: {
            platformName: 'iOS',
            automationName: 'XCUITest',
            deviceName: 'iPhone 11',
            connectHardwareKeyboard: true,
            version: '13.0',
            browserName: 'safari',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1'
        },
        automationProtocol: 'webdriver',
        connectionRetryTimeout: 90000,
        connectionRetryCount: 0,
        waitforTimeout: 30000,
        waitforInterval: 250
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

    const sPath = `./test-${port}.png`;
    await browser.saveScreenshot(sPath);
    const withoutKeyboardScreenPath = path.join(__dirname, 'without-keyboard.png');

    ls(sPath, withoutKeyboardScreenPath, {shouldCluster: true, clustersSize: 20}, function(error, res) {
        console.log('REEEESSSS');
        // throw new Error('qwr');
        // if (error) {
        //     throw error;
        // }
        console.log(hasKeyboard(res.diffClusters));
        if (hasKeyboard(res.diffClusters)) {
            console.log('I AM HERE');
            execSync(`open -a Simulator && sleep 1 && osascript -e \'tell application "Simulator"
                activate
                delay 1
                tell application "System Events" to keystroke "k" using {command down}
                delay 1
                tell application "System Events" to keystroke "k" using {command down}
                delay 1
            end tell\'`);
        }
    });
};

module.exports = async function(p) {

    return hideKeyboard(p);
    // const hidePromises = ports.map((p) => hideKeyboard(p));

    // return Promise.all(hidePromises, {concurrency: 1});
};
