/*
* Copyright (c) 2014 Stefan Marr, mail@stefan-marr.de
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
const SString = require('./SString').SString;
const u = require('../vm/Universe');

function SSymbol(value) {
    SString.call(this, value);
    var string = value,
        numberOfSignatureArguments = determineNumberOfSignatureArguments();

    this.getClass = function () {
        return u.symbolClass;
    };

    this.getString = function () {
        // Get the string associated to this symbol
        return string;
    };

    function determineNumberOfSignatureArguments() {
        // Check for binary signature
        if (isBinarySignature()) {
            return 2;
        } else {
            // Count the colons in the signature string
            var numberOfColons = 0;

            // Iterate through every character in the signature string
            for (var i = 0; i < string.length; i++) {
                if (string.charAt(i) == ':') { numberOfColons++; }
            }

            // The number of arguments is equal to the number of colons plus one
            return numberOfColons + 1;
        }
    }

    this.toString = function () {
        return "#" + string;
    };

    this.getNumberOfSignatureArguments = function () {
        return numberOfSignatureArguments;
    };

    function isBinarySignature() {
        // Check the individual characters of the string
        for (var c in string) {
            if (c != '~' && c != '&' && c != '|' && c != '*' && c != '/' && c != '@'
                && c != '+' && c != '-' && c != '=' && c != '>' && c != '<'
                && c != ',' && c != '%' && c != '\\') { return false; }
        }
        return true;
    }

    Object.freeze(this);
}

SSymbol.prototype = Object.create(SString.prototype);

exports.SSymbol = SSymbol;
