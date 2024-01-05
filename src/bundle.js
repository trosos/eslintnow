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

export { Linter, SourceCodeFixer, interpolate } from "../node_modules/eslint/lib/linter";
export { SourceCode } from "../node_modules/eslint/lib/source-code";
export * as Rules from "../node_modules/eslint/lib/linter/rules";
export * as espree from "../node_modules/espree";
export * as ajv from "../node_modules/eslint/lib/shared/ajv";

import { Legacy } from "../node_modules/@eslint/eslintrc/dist/eslintrc-universal.cjs";
export const { ConfigValidator } = Legacy;

export * as JSBI from "../jsbi-git/lib/jsbi.ts";
export * as astUtils from "../node_modules/eslint/lib/rules/utils/ast-utils";
export * as eslintUtils from "../node_modules/eslint-utils";
export * as regexpp from "../node_modules/regexpp";
export * as FixTracker from "../node_modules/eslint/lib/rules/utils/fix-tracker";
export * as keywords from "../node_modules/eslint/lib/rules/utils/keywords";
export * as unicode from "../node_modules/eslint/lib/rules/utils/unicode";
export * as LETTER_PATTERN from "../node_modules/eslint/lib/rules/utils/patterns/letters";
export * as Traverser from "../node_modules/eslint/lib/shared/traverser";
