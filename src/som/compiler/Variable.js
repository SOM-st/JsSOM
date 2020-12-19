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
//@ts-check
"use strict";
const factory = require('../interpreter/NodeFactory');

class Argument {
    constructor(name, index) {
        this.name = name;
        this.index = index;
    }

    toString() {
        return "Argument(" + this.name + ")";
    }

    isSelf() {
        return "self" === this.name || "$blockSelf" === this.name;
    }

    getReadNode(contextLevel, source) {
        return factory.createArgumentRead(this, contextLevel, source);
    }

    getWriteNode(contextLevel, valueExpr, source) {
        return factory.createArgumentWrite(this, contextLevel, valueExpr, source);
    }

    getSuperReadNode(contextLevel, holderClass, classSide, source) {
        return factory.createSuperRead(
            this, contextLevel, holderClass, classSide, source);
    }

    getIndex() {
        return this.index;
    }
}

class Local {
    constructor(name, index) {
        this.name = name;
        this.index = index;
    }

    getIndex() {
        return this.index;
    }

    toString() {
        return "Local(" + this.name + ")";
    }

    getReadNode(contextLevel, source) {
        return factory.createVariableRead(this, contextLevel, source);
    }

    getWriteNode(contextLevel, valueExpr, source) {
        return factory.createVariableWrite(this, contextLevel, valueExpr, source);
    }
}

exports.Argument = Argument;
exports.Local = Local;
