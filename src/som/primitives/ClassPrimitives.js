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
import { Primitives } from './Primitives.js';
import { universe } from '../vm/Universe.js';

function _new(frame, args) {
    return universe.newInstance(args[0]);
}

function _name(frame, args) {
    return args[0].getName();
}

function _superClass(frame, args) {
    return args[0].getSuperClass();
}

function _methods(frame, args) {
    return args[0].getInstanceInvokables();
}

function _fields(frame, args) {
    return args[0].getInstanceFields();
}

class ClassPrimitives extends Primitives {
    constructor() {
        super();
    }

    installPrimitives() {
        this.installInstancePrimitive("new", _new);
        this.installInstancePrimitive("name", _name);
        this.installInstancePrimitive("superclass", _superClass);
        this.installInstancePrimitive("methods", _methods);
        this.installInstancePrimitive("fields", _fields);
    }
}

export const prims = ClassPrimitives;
