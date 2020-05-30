'use strict';

const _ = require('lodash');
const configParser = require('gemini-configparser');
const defaults = require('./defaults');

const thr = (str) => {
    throw new TypeError(str);
};

const {root, map, section, option} = configParser;

const ENV_PREFIX = 'hermione_safari_commands_';
const CLI_PREFIX = '--hermione-safari-commands-';

const assertType = (name, validationFn, type) => {
    return (v) => !validationFn(v) && thr(`"${name}" option must be ${type}, but got ${typeof v}`);
};

const assertBoolean = (name) => assertType(name, _.isBoolean, 'boolean');
const assertArrayOfStrings = (value, name) => {
    if (!(_.isArray(value) && value.every(_.isString))) {
        throw new Error(`"${name}" must be an array of strings but got ${JSON.stringify(value)}`);
    }
};

const getParser = () => {
    return root(section({
        enabled: option({
            defaultValue: defaults.enabled,
            parseEnv: JSON.parse,
            parseCli: JSON.parse,
            validate: assertBoolean('enabled')
        }),
        browsers: map(section({
            commands: option({
                defaultValue: defaults.commands,
                parseEnv: JSON.parse,
                parseCli: JSON.parse,
                validate: (value) => {
                    _.isNull(value)
                        ? thr('Each browser must have "commands" option')
                        : assertArrayOfStrings(value, 'commands');
                }
            })
        }))
    }), {envPrefix: ENV_PREFIX, cliPrefix: CLI_PREFIX});
};

module.exports = (options) => {
    const {env, argv} = process;

    return getParser()({options, env, argv});
};
