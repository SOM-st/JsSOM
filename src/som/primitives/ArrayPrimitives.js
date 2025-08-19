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
// @ts-check

import { universe } from '../vm/Universe.js';
import { Primitives } from './Primitives.js';

function _at(_frame, args) {
  const i = args[1];
  return args[0].getIndexableField(i.getEmbeddedInteger() - 1);
}

function _atPut(_frame, args) {
  const value = args[2];
  const index = args[1];

  args[0].setIndexableField(index.getEmbeddedInteger() - 1, value);
  return args[0];
}

function _length(_frame, args) {
  return universe.newInteger(
    args[0].getNumberOfIndexableFields(),
  );
}

function _new(_frame, args) {
  const length = args[1];
  return universe.newArrayWithLength(length.getEmbeddedInteger());
}

function _doIndexes(_frame, args) {
  const block = args[1];
  const blockMethod = block.getMethod();

  const length = args[0].getNumberOfIndexableFields();
  for (let i = 1; i <= length; i += 1) { // i is propagated to Smalltalk, so, start with 1
    blockMethod.invoke(_frame, [block, universe.newInteger(i)]);
  }
  return args[0];
}

function _do(frame, args) {
  const block = args[1];
  const blockMethod = block.getMethod();

  const length = args[0].getNumberOfIndexableFields();
  for (let i = 0; i < length; i += 1) { // array is zero indexed
    blockMethod.invoke(frame, [block, args[0].getIndexableField(i)]);
  }
  return args[0];
}

class ArrayPrimitives extends Primitives {
  installPrimitives() {
    this.installInstancePrimitive('at:', _at);
    this.installInstancePrimitive('at:put:', _atPut);
    this.installInstancePrimitive('length', _length);
    this.installInstancePrimitive('doIndexes:', _doIndexes);
    this.installInstancePrimitive('do:', _do);

    this.installClassPrimitive('new:', _new);
  }
}

export const prims = ArrayPrimitives;
