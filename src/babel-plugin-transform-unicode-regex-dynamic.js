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

const types = require("@babel/types");

module.exports = function ({ types: t }) {
  return {
    visitor: {
      "NewExpression|CallExpression"(path, state) {
        if (path.node.callee.name !== "RegExp") return;
        if (path.scope.hasBinding("RegExp", true)) return;
        const args = path.node.arguments.slice();
        if (args.length !== 2) return;
        var flags = path.get("arguments.1").evaluate();
        if (flags.confident !== true) return;
        const origFlags = String(flags.value);
        if (!/[us]/.test(origFlags)) return;
        if (!state.rewritePatternId) {
          const programScope = path.scope.getProgramParent();
          state.rewritePatternId = programScope.generateUidIdentifier("rewritePattern");
          programScope.push({
            id: state.rewritePatternId,
            init: t.callExpression(t.identifier("require"), [t.stringLiteral("regexpu-core")]),
          });
        }
        const options = [];
        const newFlags = origFlags.replace("u", function () {
          options.push(t.objectProperty(t.identifier("unicodeFlag"), t.stringLiteral("transform")));
          return "";
        }).replace("s", function () {
          options.push(t.objectProperty(t.identifier("dotAllFlag"), t.stringLiteral("transform")));
          return "";
        });
        path.node.arguments = [
          t.callExpression(types.cloneNode(state.rewritePatternId), args),
          t.stringLiteral(newFlags),
        ];
        if (options.length) {
          args.push(t.objectExpression(options));
        }
      },
    },
  };
};
