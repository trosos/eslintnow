/*
 * Copyright (C) 2024 Tomas Tintera
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

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

function rmrf(names) {
  names.forEach(name => {
    fs.rmSync(path.resolve(rootDir, name), {
      recursive: true,
      force: true,
    });
  });
}

function execNpm(args) {
  childProcess.execFileSync("npm", args, {cwd: rootDir, stdio: "inherit"});
}

function clean() {
  rmrf([
    "node_modules",
    "eslint-git",
    "jsbi-git",
    "dist",
    "package-lock.json",
  ]);
}

function distclean() {
  clean();
  rmrf([
    "npm-shrinkwrap.json",
  ]);
}

function wrap() {
  distclean();
  execNpm([
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    `--before=${fs.readFileSync(path.resolve(rootDir, "timestamp.txt"), "utf8").trim()}`,
  ]);
  execNpm(["shrinkwrap"]);
  clean();
}

({
  clean,
  distclean,
  wrap,
}[process.argv[2]])();
