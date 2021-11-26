const cp = require('child_process')
const delay = require('delay')
const five = require('johnny-five');
const pixel = require('node-pixel');

const COLORS = {
  off: '00000000',
  amazonite: '3FB094ff',
  red: 'A30006ff',
  white: 'ffffffff',
  dimmed: '666666',
  orange: 'F03C02ff',
  orange2: 'FF714Bff'
}

const LED_COUNT = 17
const PULSE_FADE_MS = 300
const PULSE_SOLID_MS = 200
const PULSE_DURATION_MS = 1100

const board = new five.Board({});
let strip = null;
let isStripReady = false;

board.on('ready', function() {
  console.log('Board ready, lets add light');

  strip = new pixel.Strip({
    board: this,
    controller: 'FIRMATA',
    strips: [{pin: 6, length: LED_COUNT}],
    // gamma: 2.8
  });

  strip.on('ready', function() {
    isStripReady = true;
    //console.log("Strip ready, let's go");
  });

});

module.exports = { lightUp, lightDown, timed, COLORS }

let child = null

function solidUp(color, range) {
  const start = range[0];
  const end = range[1]
  const length = end - start;
  var promises = Array.from({ length }, (_, i) => start + i).map(i => Promise.resolve(strip.pixel(i).color(color)));
  return Promise.all(promises)
  .then(() => strip.show())  
}

function pulseLed(color, range) {
  return kill()
  .then(() => {
    return solidUp(color, range)
  })
  .then(() => delay(PULSE_DURATION_MS))
  .then(() => pulseLed(color, range));
}

function lightUp (opts) {

  if(!isStripReady) {
    return;
  }

  const range = opts.range
  const color = opts.color
  const pulse = opts.type === 'pulse' ? 1 : 0
  return kill()
  .then(() => {
    return pulse ? pulseLed(color, range) : solidUp(color, range)
  })
  .catch(err => {
    console.log("Catch Error in lightup");
    console.log(err);
  })
}

function lightDown () {
  if(!isStripReady) {
    return;
  }

  return Promise.resolve(kill());
}

async function timed (opts, duration) {
  if(!isStripReady) {
    return;
  }

  return lightUp(opts)
    .then(() => delay(duration))
    .then(kill)
}

function kill () {
  return Promise.resolve(isStripReady ? strip.off() : null);
}

function colorToRgb (color) {
  return {
    r: color.slice(0, 2),
    g: color.slice(2, 4),
    b: color.slice(4, 6)
  }
}
