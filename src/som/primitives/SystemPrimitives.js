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

import { Primitives } from './Primitives.js';
import { universe } from '../vm/Universe.js';
import { getMillisecondTicks, intOrBigInt } from '../../lib/platform.js';
import { getFileByName } from '../../lib/core-lib.js';

function _load(_frame, args) {
  const symbol = args[1];
  const result = universe.loadClass(symbol);
  return (result != null) ? result : universe.nilObject;
}

function _exit(_frame, args) {
  const error = args[1];
  return universe.exit(error.getEmbeddedInteger());
}

function _global(_frame, args) {
  const symbol = args[1];
  const result = universe.getGlobal(symbol);
  return (result != null) ? result : universe.nilObject;
}

function _hasGlobal(_frame, args) {
  if (universe.hasGlobal(args[1])) {
    return universe.trueObject;
  }
  return universe.falseObject;
}

function _globalPut(_frame, args) {
  const value = args[2];
  const symbol = args[1];
  universe.setGlobal(symbol, value);
  return args[0];
}

function _printString(_frame, args) {
  const str = args[1];
  universe.print(str.getEmbeddedString());
  return args[0];
}

function _printNewline(_frame, args) {
  universe.println('');
  return args[0];
}

function _errorPrint(_frame, args) {
  const str = args[1];
  universe.errorPrint(str.getEmbeddedString());
  return args[0];
}

function _errorPrintln(_frame, args) {
  const str = args[1];
  universe.errorPrintln(str.getEmbeddedString());
  return args[0];
}

function _time(_frame, _args) {
  const diff = getMillisecondTicks() - universe.startTime;
  return intOrBigInt(diff, universe);
}

function _ticks(_frame, _args) {
  const diff = getMillisecondTicks() - universe.startTime;
  return intOrBigInt(diff * 1000, universe);
}

function _fullGC(_frame, _args) {
  /* not general way to do that in JS */
  return universe.falseObject;
}

function _loadFile(_frame, args) {
  const fileName = args[1];
  const str = fileName.getEmbeddedString();
  const content = getFileByName(str);
  if (content === null) {
    return universe.nilObject;
  }
  return universe.newString(content);
}

class SystemPrimitives extends Primitives {
  installPrimitives() {
    this.installInstancePrimitive('load:', _load);
    this.installInstancePrimitive('loadFile:', _loadFile);
    this.installInstancePrimitive('exit:', _exit);
    this.installInstancePrimitive('hasGlobal:', _hasGlobal);
    this.installInstancePrimitive('global:', _global);
    this.installInstancePrimitive('global:put:', _globalPut);
    this.installInstancePrimitive('printString:', _printString);
    this.installInstancePrimitive('printNewline', _printNewline);
    this.installInstancePrimitive('errorPrint:', _errorPrint);
    this.installInstancePrimitive('errorPrintln:', _errorPrintln);
    this.installInstancePrimitive('time', _time);
    this.installInstancePrimitive('ticks', _ticks);
    this.installInstancePrimitive('fullGC', _fullGC);
  }
}

export const prims = SystemPrimitives;
