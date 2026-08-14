/* GCC Machine Description grammar for tree-sitter.
   Copyright (C) 2026 Pietro Monteiro <pietro@sociotechnical.xyz>.
   Copyright (C) 2026 Arsen Arsenović <arsen@aarsen.me>.
   Copyright (C) 2026 Julien Thillard <julien.thillard38@gmail.com>.

This file is part of tree-sitter-gcc-md, a tree-sitter grammar for the GCC
Machine Description Language.

tree-sitter-gcc-md is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.

tree-sitter-gcc-md is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along with
tree-sitter-gcc-md. If not, see <https://www.gnu.org/licenses/>.  */

/**
 * @file GCC Machine Description Language
 * @author Pietro Monteiro <pietro@sociotechnical.xyz>
 * @author Arsen Arsenović <arsen@aarsen.me>
 * @author Julien Thillard <julien.thillard38@gmail.com>
 * @license GPL-3.0-or-later
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'gcc_md',

  extras: $ => [
    /\s/,
    /\f/,
    $.comment,
  ],

  supertypes: $ => [
    $.expression,
  ],

  conflicts: $ => [
    [$.string, $.string_plain],
  ],

  rules: {
    source_file: $ => repeat($.expression),

    comment: $ => token(
      choice(
        seq(';', /[^\n]*/),
        seq('//', /[^\n]*/),
        seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
      ),
    ),

    expression: $ => choice(
      $.list,
      $.vector,
      $.ident,
      $.ident_with_mode,
      $.number,
      $.string,
      $.string_plain,
      $.cpp,
    ),

    // A list's string children alternate between "templated" strings (mode/code
    // iterator substitution, e.g. names and output templates) and "plain"
    // strings (C conditions, which may freely contain <, >, <<, >>, etc.).
    // Which kind is expected next depends only on what immediately precedes it:
    // right after the opening keyword (or any non-vector/non-string item) a
    // templated string is expected; right after a vector, a plain string is
    // expected; right after a string, the expectation flips.
    list: $ => seq(
      '(',
      optional($._items_expect_template),
      ')',
    ),

    _list_other_item: $ => choice(
      $.ident,
      $.ident_with_mode,
      $.number,
      $.list,
      $.cpp,
    ),

    _items_expect_template: $ => choice(
      seq(field('ubexpr', $.string), optional($._items_expect_condition)),
      seq(field('ubexpr', $.vector), optional($._items_expect_condition)),
      seq(field('ubexpr', $._list_other_item), optional($._items_expect_template)),
    ),

    _items_expect_condition: $ => choice(
      seq(field('ubexpr', $.string_plain), optional($._items_expect_template)),
      seq(field('ubexpr', $.vector), optional($._items_expect_condition)),
      seq(field('ubexpr', $._list_other_item), optional($._items_expect_template)),
    ),

    vector: $ => seq(
      '[',
      repeat(field('ubexpr', $.expression)),
      ']',
    ),


    ident: $ => choice(
      /[a-z?][a-z0-9*_-]+/,
      /[A-Za-z?_][A-Za-z0-9_]*/,
      /<[A-Za-z0-9:_-]+>/,
    ),

    ident_with_mode: $ => seq(
      field('ident', $.ident),
      ':',
      field('mode', $.ident),
    ),

    number: $ => /(-|\+)?[0-9]+/,

    string: $ => choice(
      seq(
        '"',
        repeat(choice(
          $.string_template,
          alias($._string_fragment, $.string_content),
          $.string_escape,
        )),
        '"',
      ),
      seq(
        '{@',
        repeat(alias(/[^{}]+/, $.string_content)),
        '}',
      ),
    ),

    _string_fragment: $ => token(prec(1, /[^\\"<>]+/)),

    string_template: $ => seq(
      '<',
      $._string_fragment,
      '>',
    ),

    // Plain strings (C conditions) never use <mode>/<code> iterator
    // substitution, so < and > are just ordinary content here — this lets
    // them contain shifts (<<, >>) and comparisons (<, >, <=, >=) freely.
    string_plain: $ => seq(
      '"',
      repeat(choice(
        alias($._string_plain_fragment, $.string_content),
        $.string_escape,
      )),
      '"',
    ),

    _string_plain_fragment: $ => token(prec(1, /[^\\"]+/)),

    string_escape: $ => token.immediate(
      /\\.?/,
    ),

    cpp: $ => $._cpp_brace,

    _cpp_brace: $ => seq(
      '{',
      repeat(choice(
        /[^\{\}]+/,
        $._cpp_brace,
      )),
      '}',
    ),
  },
});
