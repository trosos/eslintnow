/*
 * Copyright (C) 2022, 2023, 2024 Tomas Tintera
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

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const templateDir = path.resolve(__dirname, "../templates");
const distDir = path.resolve(__dirname, "../dist");

const payhashRegex = new RegExp(
  "code created_by created_on id mod_count package update_name updated_by updated_on"
    .split(" ").map(x => `<sys_${x}[ >].*?</sys_${x}>|<sys_${x}/>`).join("|"),
  "g"
);

let buffer = "";

function applyFilter(filter, str) {
  return ({
    cat(name) {
      return fs.readFileSync(path.resolve(templateDir, name), "utf8").replace(/\n$|\r/g, "");
    },
    eval(str) {
      return str
        .replace(/(}\n*)\n({)|(})\n(?!\n*$)|(?<!^\n*)\n({)/g, "$1$2$3$4")
        .replace(/{([\s\S]*?)}/g, (_, placeholder) => {
          const [original, ...filters] = placeholder.split("|");
          return filters.reduce((str, filter) => applyFilter(filter.trim(), str), original);
        });
    },
    set(str) {
      buffer = str;
      return "";
    },
    subs(str) {
      return str.replace(/\\([\s\S])/g, (_, char) => (
        { "\\": "\\", "l": "{", "r": "}", "p": "|", "x": buffer }[char] || ""
      ));
    },
    md5(str) {
      return crypto.createHash("md5").update(str).digest("hex");
    },
    payhash(str) {
      return [...str.replace(payhashRegex, "")].reduce((acc, char) => {
        return Math.imul(31, acc) + char.charCodeAt(0) | 0;
      }, 0).toString();
    },
    hexstamp(timeStr) {
      const date = new Date(timeStr.slice(0, 10) + "T" + timeStr.slice(11, 19) + ".000Z");
      return date.getTime().toString(16);
    },
    cdata(str) {
      if (!/<!\[CDATA\[|]]>/.test(str)) return `<![CDATA[${str}]]>`;
      return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    },
  }[filter] || function (str) {
    throw new Error("Unknown filter!");
  })(str);
}

fs.readdirSync(templateDir, {withFileTypes: true}).sort().forEach(dirent => {
  if (dirent.name.endsWith(".inc") || dirent.isDirectory()) return;
  const destName = path.resolve(distDir, dirent.name);
  fs.writeFileSync(destName, "");
  fs.writeFileSync(destName, applyFilter("eval", `{${dirent.name}|cat|eval}`).replace(/$/, "\n"));
});
