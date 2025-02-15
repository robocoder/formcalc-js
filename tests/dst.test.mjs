"use strict";

import test from "node:test";
import { strict as assert } from "node:assert";
import { DynamicSymbolTable } from '../src/dst.mjs';

test('new DynamicSymbolTable initialized at root (0) level', () => {
  const obj = new DynamicSymbolTable;

  assert.strictEqual(typeof(obj.functions), 'object');
  assert.strictEqual(obj.functions.length, 1);
  assert.ok(obj.functions[0] instanceof Map);

  assert.strictEqual(typeof(obj.variables), 'object');
  assert.strictEqual(obj.variables.length, 1);
  assert.ok(obj.variables[0] instanceof Map);

  assert.strictEqual(typeof(obj.passthru), 'object');
  assert.strictEqual(obj.passthru.length, 1);
  assert.strictEqual(typeof(obj.passthru[0]), 'undefined');
});

test('push() increaases depth and is initialized', () => {
  const obj = new DynamicSymbolTable;

  obj.push();

  assert.strictEqual(obj.functions.length, 2);
  assert.ok(obj.functions[1] instanceof Map);

  assert.strictEqual(obj.variables.length, 2);
  assert.ok(obj.variables[1] instanceof Map);

  assert.strictEqual(obj.passthru.length, 2);
  assert.strictEqual(typeof(obj.passthru[1]), 'undefined');
});

test('push()/pop() depth check', () => {
  const obj = new DynamicSymbolTable;

  assert.strictEqual(obj.functions.length, 1);

  const depth = obj.push();

  assert.strictEqual(depth, 1);
  assert.strictEqual(obj.functions.length, 2);

  obj.pop();

  assert.strictEqual(obj.functions.length, 1);
});

test('poke()/peek() value', () => {
  const obj = new DynamicSymbolTable;

  assert.strictEqual(typeof(obj.peek()), 'undefined');

  obj.poke(1);

  assert.strictEqual(obj.peek(), 1);

  obj.poke('string');

  assert.strictEqual(obj.peek(), 'string');
});

test('poke()/pop() value - scope', () => {
  const obj = new DynamicSymbolTable;

  obj.poke('foo');

  obj.push();

  assert.strictEqual(typeof(obj.peek()), 'undefined');

  obj.poke('bar');

  assert.strictEqual(obj.peek(), 'bar');

  const result = obj.pop();

  assert.strictEqual(result, 'bar');
  assert.strictEqual(obj.peek(), 'foo');
});

test('reset', () => {
  const obj = new DynamicSymbolTable;

  obj.poke('foobar');

  assert.strictEqual(obj.peek(), 'foobar');

  for (let i = 0; i < 10; i++) {
     obj.push();
  }

  assert.strictEqual(obj.passthru.length, 11);

  obj.reset();

  assert.strictEqual(obj.passthru.length, 1);
  assert.strictEqual(typeof(obj.peek()), 'undefined');
});

test('set/get variable', () => {
  const obj = new DynamicSymbolTable;

  obj.set('foo', 'bar');
  assert.strictEqual(obj.get('foo'), 'bar');

  obj.set('$', 'baz');
  assert.strictEqual(obj.get('$'), 'baz');

  obj.set('_', 'boo');
  assert.strictEqual(obj.get('_'), 'boo');

  obj.set('!', 'boz');
  assert.strictEqual(obj.get('!'), 'boz');

  obj.set('字典', 'foobar');
  assert.strictEqual(obj.get('字典'), 'foobar');

  // numeric
  obj.set('0', 'zero');
  assert.throws(() => { obj.get(0) }, /not found/);
  assert.strictEqual(obj.get('0'), 'zero');
});

test('set/get variable - scope', () => {
  const obj = new DynamicSymbolTable;

  // definitions at level 0
  obj.set('fu', 'ber');
  assert.strictEqual(obj.get('fu'), 'ber');

  obj.set('foo', 'bar');
  assert.strictEqual(obj.get('foo'), 'bar');

  // level is unchanged, so overwrite
  obj.set('foo', 'baz');
  assert.strictEqual(obj.get('foo'), 'baz');

  const s = obj.push();

  // fetches from level 0
  assert.strictEqual(obj.get('foo'), 'baz');

  // definitions at level 1
  obj.set('noo', 'bie');
  assert.strictEqual(obj.get('noo'), 'bie');

  obj.set('foo', 'biz', s);
  assert.strictEqual(obj.get('foo'), 'biz');

  obj.pop();

  assert.throws(() => { obj.get('noo') }, /not found/);
  assert.strictEqual(obj.get('foo'), 'baz');
});

test('register/find function', () => {
  const obj = new DynamicSymbolTable;
  let func;

  obj.register('inc', (_) => _ + 1);
  func = obj.find('inc');
  assert.strictEqual(func(2), 3);

  obj.register('減少', (_) => _ - 1);
  func = obj.find('減少');
  assert.strictEqual(func(4), 3);
});

test('register/find function - scope', () => {
  const obj = new DynamicSymbolTable;
  let func;

  obj.register('greeting', (_) => 'hello ' + _);
  func = obj.find('greeting');
  assert.strictEqual(func('world'), 'hello world');

  obj.push();

  // root level function has precedence
  obj.register('greeting', (_) => 'aloha ' + _);
  func = obj.find('greeting');
  assert.strictEqual(func('world'), 'hello world');

  obj.register('farewell', (_) => 'goodbye ' + _);
  func = obj.find('farewell');
  assert.strictEqual(func('world'), 'goodbye world');

  obj.pop();

  func = obj.find('greeting');
  assert.strictEqual(func('world'), 'hello world');

  assert.throws(() => { obj.find('farewell') }, /not found/);
});

test('isCollection', () => {
  const obj = new DynamicSymbolTable;

  assert.strictEqual(obj.isCollection([]), true);
  assert.strictEqual(obj.isCollection(new Array), true);
  assert.strictEqual(obj.isCollection({}), false);
});

test('nth', () => {
  const obj = new DynamicSymbolTable;
  const array = new Array();

  array.push('A');
  array.push('B');
  array.push('C');
  array.push('D');
  array.push('E');

  assert.strictEqual(obj.nth(array, 0), 'A');
  assert.strictEqual(obj.nth(array, 4), 'E');
  assert.strictEqual(obj.nth(array, 2), 'C');
  assert.strictEqual(obj.nth(array, 1), 'B');
  assert.strictEqual(obj.nth(array, 3), 'D');
});

test('nth not found', () => {
  const obj = new DynamicSymbolTable;

  assert.throws(() => { obj.nth([], 1) }, /item not found/);
  assert.throws(() => { obj.nth([], 0) }, /item not found/);
  assert.throws(() => { obj.nth([], -1) }, /item not found/);
});
