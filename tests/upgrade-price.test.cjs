const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/script.js'), 'utf8');

// Execute the production script and each real inline purchase handler.
// This fake DOM checks text updates and wiring, not browser rendering.
function game() {
  const elements = { total: {}, perClick: {} };
  const buttons = {};
  const alerts = [];
  for (const match of html.matchAll(/<button[^>]*id = "([^"]+)"[^>]*onclick = "([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)) {
    const [, id, handler, content] = match;
    let priceText = content.match(/Price: (?:<span class="price">)?([\d.]+)/)[1];
    const price = {
      get textContent() { return priceText; },
      set textContent(value) { priceText = String(value); },
    };
    buttons[id] = {
      handler,
      price,
      querySelector(selector) {
        assert.equal(selector, '.price');
        return content.includes('<span class="price">') ? price : null;
      },
    };
  }
  const context = vm.createContext({
    document: { getElementById: id => elements[id] },
    setInterval: () => 0,
    alert: message => alerts.push(message),
  });
  vm.runInContext(script, context);
  vm.runInContext('Init()', context);
  return {
    context, buttons, alerts,
    buy(id) {
      context.button = buttons[id];
      vm.runInContext('(function () {' + buttons[id].handler + '}).call(button)', context);
    },
  };
}

for (const [id, cost, gain, next] of [
  ['hoe', 10, 1, 12],
  ['spade', 1000, 4, 1200],
  ['crook', 75000, 15, 135000],
  ['scythe', 100000, 100, 300000],
]) {
  test(`${id}: purchase shows the next price and charges that amount on the next purchase`, () => {
    const g = game();
    assert.equal(g.buttons[id].price.textContent, String(cost));
    g.context.totalFunds = cost;
    g.buy(id);
    assert.equal(g.context.totalFunds, 0);
    assert.equal(g.context.perClick, 1 + gain);
    assert.equal(g.context[id].num, 1);
    assert.equal(g.buttons[id].price.textContent, String(next));
    g.context.totalFunds = next;
    g.buy(id);
    assert.equal(g.context.totalFunds, 0);
    assert.equal(g.context.perClick, 1 + gain * 2);
    assert.equal(g.context[id].num, 2);
    assert.equal(g.buttons[id].price.textContent, String(g.context[id].price));
    assert.equal(g.alerts.length, 0);
  });
}

test('unaffordable purchase leaves price, funds and click power unchanged', () => {
  const g = game();
  g.context.totalFunds = 9;
  g.buy('hoe');
  assert.equal(g.context.totalFunds, 9);
  assert.equal(g.context.perClick, 1);
  assert.equal(g.context.hoe.num, 0);
  assert.equal(g.context.hoe.price, 10);
  assert.equal(g.buttons.hoe.price.textContent, '10');
  assert.equal(g.alerts.length, 1);
});

test('ordinary clicks still earn funds and purchases leave other upgrade prices alone', () => {
  const g = game();
  vm.runInContext('for (let i = 0; i < 10; i++) Click()', g.context);
  g.buy('hoe');
  vm.runInContext('Click()', g.context);
  assert.equal(g.context.totalFunds, 2);
  assert.equal(g.buttons.spade.price.textContent, '1000');
  assert.equal(g.buttons.crook.price.textContent, '75000');
  assert.equal(g.buttons.scythe.price.textContent, '100000');
});
