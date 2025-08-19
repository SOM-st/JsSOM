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
import { SObject } from '../vmobjects/SObject.js';
import { SArray } from '../vmobjects/SArray.js';

function _equals(_frame, args) {
  const op1 = args[1];
  const op2 = args[0];
  if (op1 === op2) {
    return universe.trueObject;
  }
  return universe.falseObject;
}

function _hashcode(_frame, args) {
  const rcvr = args[0];
  let hash = rcvr.hash;
  if (hash === undefined) {
    hash = Math.round(Math.random() * 2147483647);
    rcvr.hash = hash;
  }
  return universe.newInteger(hash);
}

function _objectSize(_frame, args) {
  let size = 0;
  const rcvr = args[0];
  if (rcvr instanceof SObject) {
    size = rcvr.getNumberOfFields();
  } else if (rcvr instanceof SArray) {
    size = rcvr.getNumberOfIndexableFields();
  }
  return universe.newInteger(size);
}

function _perform(frame, args) {
  const selector = args[1];
  const rcvr = args[0];
  const invokable = rcvr.getClass().lookupInvokable(selector);
  if (invokable === null) {
    return rcvr.sendDoesNotUnderstand(selector, frame, [rcvr]);
  }
  return invokable.invoke(frame, [rcvr]);
}

function _performInSuperclass(frame, args) {
  const clazz = args[2];
  const selector = args[1];
  const rcvr = args[0];

  const invokable = clazz.lookupInvokable(selector);
  if (invokable === null) {
    return rcvr.sendDoesNotUnderstand(selector, frame, [rcvr]);
  }
  return invokable.invoke(frame, [rcvr]);
}

function _performWithArguments(frame, args) {
  const directArgs = args[2].getIndexableFields();
  const selector = args[1];
  const rcvr = args[0];

  const invokable = rcvr.getClass().lookupInvokable(selector);
  const newArgs = [rcvr].concat(directArgs);
  if (invokable === null) {
    return rcvr.sendDoesNotUnderstand(selector, frame, newArgs);
  }
  return invokable.invoke(rcvr, newArgs);
}

function _performWithArgumentsInSuperclass(frame, args) {
  const clazz = args[3];
  const directArgs = args[2].getIndexableFields();
  const selector = args[1];
  const rcvr = args[0];

  const invokable = clazz.lookupInvokable(selector);
  const newArgs = [rcvr].concat(directArgs);
  if (invokable === null) {
    return rcvr.sendDoesNotUnderstand(selector, frame, newArgs);
  }
  return invokable.invoke(frame, newArgs);
}

function _instVarAt(_frame, args) {
  const idx = args[1];
  return args[0].getField(idx.getEmbeddedInteger() - 1);
}

function _instVarAtPut(_frame, args) {
  const val = args[2];
  const idx = args[1];
  args[0].setField(idx.getEmbeddedInteger() - 1, val);
  return args[0];
}

function _instVarNamed(_frame, args) {
  const rcvr = args[0];
  const i = rcvr.getFieldIndex(args[1]);
  return rcvr.getField(i);
}

function _halt(_frame, args) {
  universe.println('BREAKPOINT');
  // eslint-disable-next-line no-debugger
  debugger;
  return args[0];
}

function _class(_frame, args) {
  return args[0].getClass();
}
class ObjectPrimitives extends Primitives {
  installPrimitives() {
    this.installInstancePrimitive('==', _equals);
    this.installInstancePrimitive('hashcode', _hashcode);
    this.installInstancePrimitive('objectSize', _objectSize);
    this.installInstancePrimitive('perform:', _perform);
    this.installInstancePrimitive('perform:inSuperclass:', _performInSuperclass);
    this.installInstancePrimitive('perform:withArguments:', _performWithArguments);
    this.installInstancePrimitive('perform:withArguments:inSuperclass:', _performWithArgumentsInSuperclass);
    this.installInstancePrimitive('instVarAt:', _instVarAt);
    this.installInstancePrimitive('instVarAt:put:', _instVarAtPut);
    this.installInstancePrimitive('instVarNamed:', _instVarNamed);
    this.installInstancePrimitive('halt', _halt);
    this.installInstancePrimitive('class', _class);
  }
}

export const prims = ObjectPrimitives;
