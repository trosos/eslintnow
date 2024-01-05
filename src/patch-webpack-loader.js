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

const diff = require("diff");
const fs = require("fs");
const path = require("path");

function tryPatch(context, resourcePath, diffName, content) {
  diff.parsePatch(fs.readFileSync(diffName, "utf8")).forEach(patch => {
    if (path.resolve(context, patch.oldFileName) === resourcePath) {
      content = diff.applyPatch(content, patch);
      if (content === false) {
        throw new Error(`Error patching ${resourcePath} with ${diffName}`);
      }
    }
  });
  return content;
}

module.exports = function (content, map, meta) {
  const patchDir = path.resolve(this.rootContext, this.getOptions().patchDir);
  fs.readdirSync(patchDir).sort().forEach(name => {
    content = tryPatch(this.rootContext, this.resourcePath, path.join(patchDir, name), content);
  });
  return content;
};
