# hermione-safari-commands

[![NPM version](https://img.shields.io/npm/v/hermione-safari-commands.svg?style=flat)](https://www.npmjs.org/package/hermione-safari-commands)
[![Build Status](https://travis-ci.org/gemini-testing/hermione-safari-commands.svg?branch=master)](https://travis-ci.org/gemini-testing/hermione-safari-commands)

Plugin for [hermione](https://github.com/gemini-testing/hermione) which is intended to add/wrap browser commands in order to work properly with the iOS safari browser.

You can read more about hermione plugins [here](https://github.com/gemini-testing/hermione#plugins).

## Installation

```bash
npm install hermione-safari-commands
```

## Usage

Plugin has following configuration:

* **enabled** (optional) `Boolean` – enable/disable the plugin, by default plugin is enabled;
* **browsers** (required) `Object` - the list of browsers to use for wrap commands;
  * **commands** (required) `Array` - commands which will be wrapped.

Also there is ability to override plugin parameters by CLI options or environment variables
(see [configparser](https://github.com/gemini-testing/configparser)).
Use `hermione_safari_commands_` prefix for the environment variables and `--hermione-safari-commands-` for the cli options.

Add plugin to your `hermione` config file:

```js
module.exports = {
    // ...
    system: {
        plugins: {
            'hermione-safari-commands': {
                enabled: true,
                browsers: {
                    safari13: {
                        commands: [
                            'url',
                            'click',
                            'screenshot',
                            'orientation',
                            'swipe',
                            'touch',
                            'dragAndDrop'
                        ]
                    }
                }
            }
        }
    },
    //...
}
```

### Existing safari commands:

Wrappers over existing commands:
* **url** - wrapper over wdio "url" in order to wait until the page is completely open (used timeout from [`hermione.pageLoadTimeout`](https://github.com/gemini-testing/hermione#pageloadtimeout) or `30000` ms). In [appium-xcuitest-driver](https://github.com/appium/appium-xcuitest-driver) page is open with using the `xcrun` utility - `xcrun simctl openurl` which just tells the simulator to open the page and does not wait anything;
* **click** - replaces wdio "click" in order to perform real touch click (by default it emits only events on passed element). Should be used with **touch** command;
* **screenshot** - wrapper of wdio "screenshot" in order to cut the native elements from the final image ([calibration](https://github.com/gemini-testing/hermione#calibrate) must be turned off);
* **orientation** - wrapper of wdio "orientation" in order to recalculate size of native elements for "screenshot" command (turns on automatically when you specify a screenshot command);
* **swipe** - replaces wdio "swipe" in order to perform swipe by coordinates in native context;
* **touch** - replaces wdio "touch" in order to perform touch click by coordinates in native context;
* **dragAndDrop** - replaces wdio "dragAndDrop" in order to perform drag and drop elements by coordinates in native context.

## Testing

Run [mocha](http://mochajs.org) tests:
```bash
npm run test-unit
```

Run [eslint](http://eslint.org) codestyle verification
```bash
npm run lint
```
