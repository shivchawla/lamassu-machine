// const cp = require('child_process')
const delay = require('delay')
const five = require('johnny-five');
const pixel = require('node-pixel');

const COLORS = {
  off: '#00000000',
  amazonite: '#3FB094ff',
  red: '#A30006ff',
  white: '#ffffffff',
  dimmed: '#666666',
  orange: '#F03C02ff',
  orange2: '#FF714Bff'
}

const LED_COUNT = 12
const PULSE_FADE_MS = 300
const PULSE_SOLID_MS = 200
const PULSE_DURATION_MS = 500

const board = new five.Board({});
let strip = null;
let isStripReady = false;

let INTERRUPT = false;

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
    console.log("Strip ready, let's go");
    // lightDown();
  });

});

module.exports = { lightUp, lightDown, timed, COLORS }

let ACTIVE = false;

function checkInterrupt() {
  return INTERRUPT;
}

function setInterrupt(val) {
  INTERRUPT = val;
}

function solidUp(color, range) {
  const start = range[0];
  const end = range[1]
  const length = end - start + 1;

  console.log(Array.from({ length }, (_, i) => start + i));

  Array.from({ length }, (_, i) => start + i).map(i => strip.pixel(i).color(color));

  console.log("Showing Strip"); 
  return Promise.resolve(strip.show());  
}

function pulseUp(color, range) {``
  return solidUp(color, range)
  .then(() => delay(PULSE_DURATION_MS))  
}


function pulseLed(color, range) {
   return pulseUp(color, range) 
  .then(() => pulseUp(COLORS.off, range))
  .then(() => {
    if (checkInterrupt()) {
      strip.off();
      setInterrupt(false); 
      return;
    }
    
    return pulseLed(color, range);

  });
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
    console.log("Is it Pulse: ", pulse ?  'TRUE' : 'FALSE');
    ACTIVE = true;
    return pulse ? pulseLed(color, range) : solidUp(color, range)
  })
  .then(() => {
    INTERRUPT = false;
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

  console.log("Turning off led strip");

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
  console.log("Killing LED");

  return new Promise((resolve, reject) => {
    setInterrupt(ACTIVE); 
    strip.off();
    resolve();
  })
  .then(() => {
    ACTIVE = false;
  })
}

function colorToRgb (color) {
  return {
    r: color.slice(0, 2),
    g: color.slice(2, 4),
    b: color.slice(4, 6)
  }
}
