'use strict';


module.exports = function(S) {
    const _ = require('lodash'),
        path = require('path'),
        Promise = require('bluebird'),
        SCli = require(S.getServerlessPath('utils/cli')),
        SError = require(S.getServerlessPath('Error')),
        chalk = require('chalk'),
        eslint = require('eslint').linter,
        decomment = require('decomment'),
        readFile = Promise.promisify(require('fs').readFile),
        util = require('util');

    class ServerlessESLint extends S.classes.Plugin {
        constructor(config) {
            super();
            if (!config) config = {};
            this.log = config.logger || SCli.log;
        }

        static getName() {
            return 'com.nishant.' + ServerlessESLint.name;
        }

        registerActions() {
            S.addAction(this.functionESLint.bind(this), {
                handler: 'functionESLint',
                description: 'Detects errors and potential problems in your Lambda function',
                context: 'function',
                contextAction: 'eslint',
                parameters: [{
                    parameter: 'names',
                    description: 'One or multiple function names',
                    position: '0->'
                }]
            });

            return Promise.resolve();
        }

        functionESLint(evt) {
            return this._validateAndPrepare(evt.options.names)
                .then(func => {
                    return this._lint(func)
                        .then(() => {
                            this.log(chalk.bold.green('Success! - No linting errors found.'));
                        })
                        .catch(err => {
                            this.log(chalk.bold.red('Error! - Linting errors found.'));
                            err.forEach(error => {
                                let type = error.severity === 1 ? "Warning" : "Error";
                                this.log(chalk.red(util.format("%d:%d %s: %s", error.line, error.column, type, error.message)));

                            });
                        });
                });
        }

        _validateAndPrepare(names) {
            try {
                return Promise.resolve(_.map(names, name => {
                    const func = S.getProject().getFunction(name);
                    if (!func) throw new SError(`Function "${name}" doesn't exist in your project`);
                    if (func.runtime !== 'nodejs') throw new SError('ESLint does not support runtimes other than "nodejs".');
                    return func;
                }));
            } catch (err) {

                return Promise.reject(err);
            }
        }

        _lint(functions) {
            return Promise.each(functions, func => {
                const file = func.getRootPath(func.handler.split('/').pop().split('.')[0] + '.js');

                return this._getConfig()
                    .then(config => {
                        return readFile(file, 'utf-8')
                            .then(data => {
                                const result = eslint.verify(data, _.merge({
                                    "env": {
                                        "node": true
                                    }
                                }, config));

                                if (result.length > 0) {
                                    return Promise.reject(result);
                                }

                                return Promise.resolve();
                            });
                    });
            });
        }

        _getConfig() {
            return readFile(S.getProject().getRootPath('.eslintrc'), 'utf-8')
                .then(config => {
                    return JSON.parse(decomment(config));
                })
                .catch(err => {
                    return {};
                });
        }
    }

    return ServerlessESLint;
};