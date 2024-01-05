/*
 * Copyright (C) 2022 Tomas Tintera
 *
 * Permission to use, copy, modify, and/or distribute this
 * software for any purpose with or without fee is hereby
 * granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS
 * ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
 * EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
 * WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH
 * THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/*
 * This is a dirty hack to quickly extract some (most) upstream rule tests.
 */

const require_ = require;
const path_ = require_("path");
function UnrecognizedRequire() {}
function UnsupportedDefineRule() {}

(function () {
  const fs = require_("fs");
  const testDir = path_.resolve(__dirname, "../eslint-git/tests/lib/rules");
  const tests = [];

  fs.readdirSync(testDir).sort().forEach(testName => {
    if (testName.endsWith(".js")) {
      try {
        tests.push(...extract(path_.join(testDir, testName)));
      } catch (e) {
        if (e instanceof UnrecognizedRequire || e instanceof UnsupportedDefineRule) {
          tests.push([testName, {}, {valid: [], invalid: [], skipped: true}]);
        } else {
          throw e;
        }
      }
    }
  });

  const flatTests = flatten(tests);
  const half = flatTests.length/2;
  writeJson(flatTests.slice(0, half), "ruleTestsChunk1");
  writeJson(flatTests.slice(half), "ruleTestsChunk2");
}());

function writeJson(obj, dest) {
  const fs = require_("fs");
  const json = JSON.stringify(obj, null, 2).replace(/[\u007f-\uffff]/g, chr => "\\u" + chr.charCodeAt(0).toString(16).padStart(4, "0"));
  fs.writeFileSync(path_.resolve(__dirname, "../dist", dest + ".js"), `var ${dest} = ${json};\n`);
}

function flatten(tests) {
  const merge = require_("lodash.merge");
  const res = [];
  tests.forEach(test => {
    test[2].valid.forEach(item => {
      var testDef = item;
      if (typeof testDef === "string") {
        testDef = { code: testDef };
      }
      const config = {};
      ["env", "globals", "parserOptions"].forEach(name => {
        if (Object.hasOwnProperty.call(testDef, name)) {
          config[name] = testDef[name];
        }
      });
      var ast;
      if (Object.hasOwnProperty.call(testDef, "parser")) {
        ast = require_(testDef.parser).parse();
      }
      res.push({
        ruleId: test[0],  // string
        validity: "valid",
        code: testDef.code,  // string
        options: testDef.options || [],  // Array
        config: merge({}, test[1], config),
        ast,
      });
    });

    test[2].invalid.forEach(item => {
      var testDef = item;
      const config = {};
      ["env", "globals", "parserOptions"].forEach(name => {
        if (Object.hasOwnProperty.call(testDef, name)) {
          config[name] = testDef[name];
        }
      });
      var ast;
      if (Object.hasOwnProperty.call(testDef, "parser")) {
        ast = require_(testDef.parser).parse();
      }
      if (typeof testDef.errors === "number") {
        testDef.errors = Array.apply(null, Array(testDef.errors)).map(Object);
      }
      if (testDef.output === undefined || testDef.output === null) {
        testDef.output = testDef.code;
      }
      testDef.errors = testDef.errors.map(error => {
        if (typeof error === "string") {
          return { message: error };
        }
        if (error.suggestions === null) {
          error.suggestions = [];
        }
        if (error.type !== undefined) {
          error.nodeType = error.type;
          delete error.type;
        }
        return error;
      });
      res.push({
        ruleId: test[0],  // string
        validity: "invalid",
        code: testDef.code,  // string
        options: testDef.options || [],  // Array
        config: merge({}, test[1], config),
        errors: testDef.errors,  // Array({column, data, endColumn, endLine, line, message (TODO: what type?), messageId, suggestions[{data, desc, messageId, output}], nodeType})
        output: testDef.output,  // string
        ast,
      });
    });

    if (test[2].skipped) {
      res.push({
        suiteId: test[0],
        validity: "skipped",
      });
    }
  });
  return res;
}

function extract(testPath) {
  return eval('' +
    '(function (origdirname) {\n' +
    '  const tests_ = [];\n' +
    '  const __dirname = path_.resolve(origdirname, "../eslint-git/tests/lib/rules");\n' +
    '  function require(name) {\n' +
    '    if (/^\\.\\.\\/\\.\\.\\/\\.\\.\\/lib\\/rules\\/[^/]+$/.test(name)) return;\n' +
    '    switch (name) {\n' +
    '      case "path":\n' +
    '      case "fs":\n' +
    '      case "lodash.merge":\n' +
    '        return require_(name);\n' +
    '      case "../../fixtures/fixture-parser":\n' +
    '      case "../../_utils":\n' +
    '        return require_(path_.resolve(__dirname, name));\n' +
    '      case "../../../lib/rule-tester":\n' +
    '        function RuleTester(testerConfig) {\n' +
    '          this.testerConfig = testerConfig || {};\n' +
    '        }\n' +
    '        RuleTester.prototype = {\n' +
    '          run(ruleName, rule, test) {\n' +
    '            tests_.push([ruleName, this.testerConfig, test]);\n' +
    '          },\n' +
    '          defineRule() {\n' +
    '            throw new UnsupportedDefineRule();\n' +
    '          },\n' +
    '        };\n' +
    '        return { RuleTester };\n' +
    '    }\n' +
    '    throw new UnrecognizedRequire();\n' +
    '  }\n' +
    '  require.resolve = name => path_.resolve(__dirname, name);\n' +
    require_("fs").readFileSync(testPath, "utf8") +
    '\n;\n' +
    '  return tests_;\n' +
    '}(__dirname));');
}
