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

import { assert } from '../../lib/assert.js';

import { Node } from './Node.js';

import { SClass } from '../vmobjects/SClass.js';
import { SSymbol } from '../vmobjects/SSymbol.js';

import { universe } from '../vm/Universe.js';

export class GenericDispatchNode extends Node {
  constructor(selector) {
    super(null);
    this.selector = selector;
  }

  executeDispatch(frame, args) {
    const rcvr = args[0];
    const rcvrClass = rcvr.getClass();

    const method = rcvrClass.lookupInvokable(this.selector);
    if (method !== null) {
      return method.invoke(frame, args);
    }
    return rcvr.sendDoesNotUnderstand(this.selector, frame, args);
  }
}

export class UninitializedSuperDispatchNode extends Node {
  constructor(selector, holderClass, classSide) {
    super(null);
    assert(holderClass instanceof SSymbol);
    this.selector = selector;
    this.classSide = classSide;
    this.holderClass = holderClass;
  }

  getLookupClass() {
    let clazz = universe.getGlobal(this.holderClass);
    if (this.classSide) {
      clazz = clazz.getClass();
    }
    return clazz.getSuperClass();
  }

  executeDispatch(frame, args) {
    const lookupClass = this.getLookupClass();
    // eslint-disable-next-line no-use-before-define
    return this.replace(new CachedSuperDispatchNode(this.selector, lookupClass))
      .executeDispatch(frame, args);
  }
}

class CachedSuperDispatchNode extends Node {
  constructor(selector, lookupClass) {
    super(null);
    this.selector = selector;
    assert(lookupClass instanceof SClass);
    this.method = lookupClass.lookupInvokable(selector);
  }

  executeDispatch(frame, args) {
    if (this.method === null) {
      const rcvr = args[0];
      return rcvr.sendDoesNotUnderstand(this.selector, frame, args);
    }
    return this.method.invoke(frame, args);
  }
}
