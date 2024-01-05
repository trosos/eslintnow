# ESLintNow

ESLintNow is an unofficial ES5 port of [ESLint](https://eslint.org/),
suitable for prehistoric and quirky JavaScript engines (like the one
that the ServiceNow platform uses for its *ES5 Standards Mode*).

## Table of contents
  1. [Build dependencies](#build-dependencies)
  2. [Build](#build)
  3. [Usage](#usage)
  4. [Installation to ServiceNow](#installation-to-servicenow)
  5. [Usage example in ServiceNow](#usage-example-in-servicenow)
  6. [Custom rules](#custom-rules)
  7. [Test coverage](#test-coverage)
  8. [License](#license)

## Build dependencies
  To be able to build the distribution, you should only need
  [git](https://git-scm.com/),
  [Node.js](https://nodejs.org/) and
  [npm](https://www.npmjs.com/package/npm) preinstalled.

## Build
  0. Download the latest version of this distribution:
     ```shell
     git clone https://github.com/trosos/eslintnow.git
     ```

  1. Set the working directory:
     ```shell
     cd eslintnow
     ```

  2. Figure out the dependencies as they were at the time of
     [timestamp.txt](timestamp.txt):
     ```shell
     npm run wrap
     ```

  3. Download the dependencies:
     ```shell
     npm ci
     ```

  4. Build the bundle, extract the automatic tests and pack everything
     into an Update Set: 
     ```shell
     npm run build
     ```

## Usage
  The bundle exposes only a subset of classes exported by the *eslint*
  npm package, namely `Linter` and `SourceCode`, plus some helpers.
  They are accessible as properties of the `bundle` variable,
  declared in the namespace in which the bundle was included
  (this will typically be `x_eslintnow`).

  If you choose to install ESLintNow
  [via the Update Set](#installation-to-servicenow),
  then you can also enjoy the convenience shortcuts `x_eslint.Linter`,
  `x_eslint.SourceCode`, and so on.

  You can use these classes in accordance with the official
  [ESLint documentation](
   https://eslint.org/docs/latest/developer-guide/nodejs-api).

  For a complete list of exported classes in the bundle, look
  into [src/bundle.js](src/bundle.js). Alternatively, you can explore
  the proxy Script Includes in the generated Update Set.

## Installation to ServiceNow
This is the recommended way to use ESLintNow with ServiceNow.

*TL;DR:*
Commit the Update Set in `dist/eslintnow.xml` and you are good to go.

  1. In ServiceNow, navigate to *System Update Sets* > *Retrieved
     Update Sets*.

  2. Follow the Related link *Import Update Set from XML*.

  3. Select the file `dist/eslintnow.xml` generated in
     the [Build](#build) step above, and press the *Upload* button.

  4. Locate the imported Update Set (its name starts with ESLintNow)
     and open it by clicking the corresponding *Preview* icon in
     the left column, and pressing *Open Record* afterwards.

  5. On the form of the ESLintNow Retrieved Update Set, press
     the *Preview Update Set* button.

  6. After the preview completes, close the dialog.

  7. If the preview failed, resolve all preview problems.

  8. Press the *Commit Update Set* button.

  9. After the commit completes, close the dialog.

### Alternative: manual installation
  Alternatively, you can install the ESLintNow core manually.

  Using this method is discouraged and there is no point in doing so,
  other than trying to understand how things work.
  This info is provided mainly for users of other JavaScript
  engines, to help them understand how to use ESLintNow outside of
  the ServiceNow environment.

  1. In ServiceNow, create a new application with JavaScript Mode
     set to *ES5 Standards Mode*.\
     Example application name: `x_eslintnow`.

  2. Inside your new application, create a new Script Include, named
     `bundle`.

  3. Configure your Script Include to be accessible from all
     application scopes.

  4. Copy-paste the content of the generated `dist/bundle.js` into
     the `Script` field of your Script Include.

## Usage example in ServiceNow
  To quickly test your installation, use the ServiceNow module
  `Scripts - Background`. Select `global scope` and run:
  ```javascript
  var linter = new x_eslintnow.bundle.Linter();
  var result = linter.verify("var foo", {
    rules: {
      semi: 2
    }
  });
  gs.print(JSON.stringify(result, null, 2));
  ```

  You should see something along the following lines:
  ```
  *** Script: [
    {
      "ruleId": "semi",
      "severity": 2,
      "message": "Missing semicolon.",
      "line": 1,
      "column": 8,
      "nodeType": "VariableDeclaration",
      "messageId": "missingSemi",
      "fix": {
        "range": [
          7,
          7
        ],
        "text": ";"
      }
    }
  ]
  ```

## Custom rules
  In addition to the ESLint core rules, you can define custom rules
  using the `Linter#defineRule` API, as defined in the ESLint
  documentation.

  For example, in ServiceNow, you can do the following:
  ```javascript
  var linter = new x_eslintnow.bundle.Linter();
  linter.defineRule("my-rule", {
    meta: {
      messages: {
        call_prohibited: "You call {{fun_name}} in your code, but you should only call be_nice."
      }
    },
    create: function (context) {
      return {
        CallExpression: function (node) {
          if (node.callee.type === "Identifier") {
            context.report({
              node: node,
              messageId: "call_prohibited",
              data: {
                fun_name: JSON.stringify(node.callee.name)
              }
            });
          }
        }
      };
    }
  });
  var result = linter.verify("({ something: be_bad(naughty) });", {
    rules: {"my-rule": [1]}
  });
  gs.print(JSON.stringify(result, null, 2));
  ```

  When run as a ServiceNow Background Script, the above code should
  print something like this:
  ```
  *** Script: [
    {
      "ruleId": "my-rule",
      "severity": 1,
      "message": "You call \"be_bad\" in your code, but you should only call be_nice.",
      "line": 1,
      "column": 15,
      "nodeType": "CallExpression",
      "messageId": "call_prohibited",
      "endLine": 1,
      "endColumn": 30
    }
  ]
  ```

## Test coverage
  ESLint provides an exhausting set of automated tests for each
  of the core rules. Most of these tests are extracted as part
  of the build process of ESLintNow; the tests that ESLintNow fails
  to provide pertain to the following core ESLint rules:

  * comma-dangle
  * func-name-matching
  * no-misleading-character-class
  * no-unused-vars
  * prefer-const
  * prefer-regex-literals
  * strict

  While it would be theoretically possible to extract these tests
  as well, it would require more work on the extraction engine
  and/or on the ESLintNow's custom rule tester.

  On ServiceNow, all of the remaining ESLint core rules should pass
  every of their automatic tests. You can execute the tests by running
  the following as a ServiceNow Background Script:
  ```javascript
  var outcomes = [];
  gs.print(JSON.stringify(x_eslintnow.ruleTester.runAllTests(outcomes), null, 2));
  gs.print("----------");
  gs.print(JSON.stringify(outcomes, null, 2));
  ```
 
  Be patient and give the process some time: the custom tester is not
  heavily optimized and the package contains plenty of tests. It can
  easily happen that they will take around 30 minutes to complete.

## License
  This software is distributed under the
  [BSD Zero Clause License](COPYING).
