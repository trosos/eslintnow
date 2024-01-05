/*
 * Copyright (C) 2022, 2023 Tomas Tintera
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

var ruleTester = (function () {
  function TestOutcome(result, message) {
    this.result = result;
    this.message = message;
  }

  function TestFailed(message) {
    return new TestOutcome("fail", message);
  }

  function TestError(message) {
    return new TestOutcome("error", message);
  }

  function assertSchemaValid(test) {
    var rule = rules.get(test.ruleId);
    var schema = configValidator.getRuleOptionsSchema(rule);
    if (schema) {
      ajv.validateSchema(schema);
      if (ajv.errors) throw TestFailed("Schema for rule is invalid");
      try {
        ajv.compile(schema);
      } catch (e) {
        throw TestFailed("Error compiling rule schema");
      }
    }
  }

  function constructConfig(test) {
    var config = {
      rules: {},
    };
    config.rules[test.ruleId] = [1].concat(test.options);
    Object.keys(test.config).forEach(function (name) {
      config[name] = test.config[name];
    });
    if (test.ast !== undefined) {
      config.parser = "dummy";
    }
    assertSchemaValid(test);
    try {
      configValidator.validate(config, "ruleTester");
    } catch (e) {
      throw TestFailed("Error validating config against schema");
    }
    return config;
  }

  function newLinter(test) {
    var linter = new bundle.Linter();
    if (test.ast !== undefined) {
      var ast = JSON.parse(JSON.stringify(test.ast));
      linter.defineParser("dummy", {
        parse: function () { return ast; }
      });
    }
    return linter;
  }

  function verify(test) {
    return newLinter(test).verify(test.code, constructConfig(test));
  }

  function assertSuggestionMatches(expected, actual, test) {
    if (actual === null || typeof actual !== "object") throw TestFailed("Suggestion should be an object but wasn't");
    if (expected.desc !== undefined) {
      if (actual.desc !== expected.desc) throw TestFailed("Suggestion desc didn't match");
    }
    if (expected.messageId !== undefined) {
      if (actual.messageId !== expected.messageId) throw TestFailed("Suggestion messageId didn't match");
      var meta = rules.get(test.ruleId).meta;
      var messages = meta && meta.messages;
      if (messages === undefined) throw TestFailed("Suggestion cannot use messageId if rule doesn't define meta.messages");
      var unformattedOriginalDesc = messages[expected.messageId];
      if (unformattedOriginalDesc === undefined) throw TestFailed("Suggestion messageId not defined in meta.messages");
      if (expected.data !== undefined) {
        var rehydratedDesc = bundle.interpolate(
          unformattedOriginalDesc,
          expected.data
        );
        if (actual.desc !== rehydratedDesc) throw TestFailed("Hydrated suggestion desc didn't match");
      }
    } else if (expected.data !== undefined) throw TestError("Test suggestion must specify messageId if data is used");
    if (expected.output !== undefined) {
      var codeWithAppliedSuggestion = bundle.SourceCodeFixer.applyFixes(test.code, [actual]).output;
      if (codeWithAppliedSuggestion !== expected.output) throw TestFailed("Suggestion fix output didn't match");
    }
  }

  function assertErrorMatches(expected, actual, test) {
    if (actual === null || typeof actual !== "object") throw TestFailed("Error should be an object but wasn't");
    ["message", "messageId", "nodeType", "line", "column", "endLine", "endColumn"].forEach(function (element) {
      if (expected[element] !== undefined) {
        if (actual[element] !== expected[element]) throw TestFailed("Error " + element + " didn't match");
      }
    });
    if (expected.messageId !== undefined) {
      var meta = rules.get(test.ruleId).meta;
      var messages = meta && meta.messages;
      if (messages === undefined) throw TestFailed("Error cannot use messageId if rule doesn't define meta.messages");
      var unformattedOriginalMessage = messages[expected.messageId];
      if (unformattedOriginalMessage === undefined) throw TestFailed("Error messageId not defined in meta.messages");
      if (expected.data !== undefined) {
        var rehydratedMessage = bundle.interpolate(
          unformattedOriginalMessage,
          expected.data
        );
        if (actual.message !== rehydratedMessage) throw TestFailed("Hydrated error message didn't match");
      }
    } else if (expected.data !== undefined) throw TestError("Test error must specify messageId if data is used");
    if (expected.suggestions !== undefined) {
      if (!Array.isArray(expected.suggestions)) throw TestError("If test specifies suggestions, it must be an array");
      var actualSuggestions = actual.suggestions;
      if (actualSuggestions === undefined) actualSuggestions = [];
      if (!Array.isArray(actualSuggestions)) throw TestFailed("Error should have an array of suggestions but didn't");
      if (actualSuggestions.length !== expected.suggestions.length) throw TestFailed("Error should have " + expected.suggestions.length + " suggestions but had " + actualSuggestions.length);
      expected.suggestions.forEach(function (expectedSuggestion, i) {
        assertSuggestionMatches(expectedSuggestion, actualSuggestions[i], test);
      });
    }
  }

  function assertTestInvalid(test) {
    var result = verify(test);
    if (!Array.isArray(result)) throw TestError("Linter#verify should return an array but didn't");

    if (result.some(function (error) {
      return error.fatal;
    })) throw TestFailed("Fatal parsing error occured");

    if (result.length !== test.errors.length) throw TestFailed("Should have " + test.errors.length + " errors but had " + result.length);

    test.errors.forEach(function (expectedError, i) {
      assertErrorMatches(expectedError, result[i], test);
    });

    if (result.every(function (actualError) {
        return actualError.ruleId !== test.ruleId;
    })) throw TestFailed("Some error rule name should be the same as the rule being tested");

    var fixedCode = bundle.SourceCodeFixer.applyFixes(test.code, result).output;
    if (fixedCode !== test.output) throw TestFailed("Fixed code didn't match");

    if (fixedCode !== test.code) {
      var errorsAfterFix = newLinter(test).verify(fixedCode, constructConfig(test));
      if (errorsAfterFix.some(function (error) {
        return error.fatal;
      })) throw TestFailed("Fatal parsing error occured in autofix");
    }
  }

  function assertTestValid(test) {
    var result = verify(test);
    if (!Array.isArray(result)) throw TestError("Linter#verify should return an array but didn't");
    if (result.length !== 0) throw TestFailed("Should have no errors but had " + result.length);
  }

  function runTest(test) {
    try {
      switch (test.validity) {
        case "valid":
          assertTestValid(test);
          break;
        case "invalid":
          assertTestInvalid(test);
          break;
        case "skipped":
          throw new TestOutcome("skip");
        default:
          throw TestError("Invalid test.validity");
      }
    } catch (e) {
      if (e instanceof TestOutcome) return e;
      throw e;
    }
    return new TestOutcome("pass");
  }

  function runTests(tests, outcomes) {
    var stats = {};
    tests.forEach(function (test) {
      var outcome = runTest(test);
      var ruleId = test.ruleId || test.suiteId;
      var ruleStat = stats[ruleId] = stats[ruleId] || {
        pass: 0,
        fail: 0,
        skip: 0,
        error: 0,
      };
      ruleStat[outcome.result] += 1;
      if (outcomes && outcome.result !== "pass") {
        outcomes.push({
          test: test,
          outcome: outcome,
        });
      }
    });
    return stats;
  }

  function runAllTests(outcomes) {
    return runTests(ruleTests, outcomes);
  }

  var ajv = bundle.ajv({ strictDefaults: true });
  var rules = new bundle.Rules();
  var configValidator = new bundle.ConfigValidator({
    builtInRules: rules
  });

  return {
    runTest: runTest,
    runTests: runTests,
    runAllTests: runAllTests,
  };
}());
