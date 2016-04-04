# Serverless ESLint Plugin

A Serverless Plugin for the [Serverless Framework](http://www.serverless.com) which
adds support for [ESLint](http://http://eslint.org/) linting.

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)


**THIS PLUGIN REQUIRES SERVERLESS V0.5 OR HIGHER!**

## Introduction

This plugins adds capabilities to lint your Lambda functions before deploying. It also
saves you from deploying ES6 syntax by accident.

## Installation

In your project root, run:

```bash
npm install --save serverless-eslint-plugin
```

Add the plugin to `s-project.json`:

```json
"plugins": [
  "serverless-eslint-plugin"
]
```

## Usage

Run the *eslint* action to check one or multiple functions for errors:

```
serverless function eslint someFunction someOtherFunction
```

To apply custom configuration, add a `.eslintrc` file in the project root.

Note :- This project is based on [serverless-jshint-plugin](https://github.com/joostfarla/serverless-jshint-plugin)

ISC License. See the [LICENSE](LICENSE) file.
