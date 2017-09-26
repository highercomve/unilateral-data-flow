(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){

var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;

},{"./rng":1}],3:[function(require,module,exports){
'use strict';

var _state_manager = require('./state_manager');

var _state_manager2 = _interopRequireDefault(_state_manager);

var _task_reducer = require('./task_reducer');

var _task_reducer2 = _interopRequireDefault(_task_reducer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var combinedReducer = _state_manager2.default.combineReducers({
  tareas: _task_reducer2.default
});
var store = _state_manager2.default.storeFactory(combinedReducer);
var app = document.getElementById('todo-list');
var formTarea = document.getElementById('tarea');
var counterDom = document.getElementById('counter');

formTarea.addEventListener('submit', function (event) {
  event.preventDefault();
  store.dispatch({
    type: 'TASK_ADD',
    payload: {
      text: event.target[0].value
    }
  });
  event.target[0].value = '';
});

app.addEventListener('click', function (event) {
  if (event.target && event.target.className == "content") {
    event.preventDefault();
    store.dispatch({
      type: 'TASK_TOGGLE',
      payload: event.target.parentElement.id
    });
  }
});

app.addEventListener('click', function (event) {
  if (event.target && event.target.className == "todo-remove") {
    event.preventDefault();
    store.dispatch({
      type: 'TASK_REMOVE',
      payload: event.target.parentElement.id
    });
  }
});

store.subscribe(function () {
  var state = store.getState();
  renderTareas(state.tareas, app);
});

store.subscribe(function () {
  renderCounter(store.getState().tareas.length, counterDom);
});

function renderTareas(tareas, domElement) {
  domElement.innerHTML = '\n    <ul>\n      ' + listaDeTareas(tareas) + '\n    </ul>\n  ';
}

function listaDeTareas(tareas) {
  return tareas.reduce(function (htmlAcumulado, tarea, tareas) {
    return '\n      ' + htmlAcumulado + '\n      <li id="' + tarea.id + '" class="' + (tarea.done ? 'ready' : 'not-ready') + '">\n        <span class="content">\n          ' + tarea.text + '\n        </span>\n        <button class="todo-remove">\n          \u2612\n        </button>\n      </li>\n    ';
  }, '');
}

function renderCounter(count, domElement) {
  domElement.innerHTML = '\n    <h6>\n      Cantidad tareas: ' + count + '\n    </h6>\n  ';
}

},{"./state_manager":4,"./task_reducer":5}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

/*
 * reducers: Objeto
 * {
 *  key // la parte del state modifica
 *  function
 * } 

 *	Ejemplo
 * {
 *  tasks: taskReducer
 *  user: userReducer
 *  posts: postReducer
 * }
 *
 * La idea es identificar la parte del state que va a manejar cada reducers
 * de manera de generar una funcion de reduccion que combine y realize una composicion
 * para manejar el state
 * {
 *  tasks: [],
 *  user: {},
 *  posts: [],
 *  general: {
 *    isLogin: bool,
 *  }
 * }
 *
 */

function combineReducers(reducers) {
  // La funcion comnbine reducers debe tomar el objeto que mapea 
  // la parte del state y la funcion que se encarga de manegar acciones de dicha 
  // parte

  // Dicha funcion al igual que cualquier reducer toma como parametros la action y el state
  // Y retorna un estado nuevo

  return function (action, state) {
    return Object.keys(reducers).reduce(function (CombineState, key) {
      CombineState[key] = reducers[key](action, state[key]);
      return CombineState;
    }, {});
  };
}

function storeFactory(reducer) {
  var state = {};
  var listeners = [];

  function dispatch(action) {
    state = reducer(action, state);
    listeners.forEach(function (listener) {
      listener();
    });
  }

  function subscribe(callback) {
    listeners.push(callback);
    return function () {
      listeners = listeners.filter(function (listeners) {
        return listeners !== callback;
      });
    };
  }

  function getState() {
    return state;
  }

  return {
    dispatch: dispatch,
    getState: getState,
    listen: listen
  };
}

var StateManager = {
  storeFactory: storeFactory,
  combineReducers: combineReducers
};

exports.default = StateManager;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addTask(state, newTask) {
  Object.assign(newTask, {
    id: _uuid2.default.v1(),
    done: false
  });
  return [].concat(state, [newTask]);
}

function removeTask(state, id) {
  return state.filter(function (task) {
    return task.id !== id;
  });
}

function toggleTask(state, id) {
  var index = state.findIndex(function (task) {
    return task.id === id;
  });
  return [].concat(state.slice(0, index), toggleStatus(state[index]), state.slice(index + 1));
}

function toggleStatus(task) {
  return Object.assign({}, task, {
    done: !task.done
  });
}

function taskReducer(action) {
  var state = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  action = !action ? { type: null } : action;
  switch (action.type) {
    case 'TASK_ADD':
      return addTask(state, action.payload);
    case 'TASK_REMOVE':
      return removeTask(state, action.payload);
    case 'TASK_TOGGLE':
      return toggleTask(state, action.payload);
    default:
      return state;
  }
}

exports.default = taskReducer;

},{"uuid":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvdXVpZC9ybmctYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL3V1aWQuanMiLCJzcmMvYXBwLmpzIiwic3JjL3N0YXRlX21hbmFnZXIuanMiLCJzcmMvdGFza19yZWR1Y2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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LEVBQUMsTUFBTSxJQUFQLEVBQVosR0FBMkIsTUFBcEM7QUFDQSxVQUFRLE9BQU8sSUFBZjtBQUNFLFNBQUssVUFBTDtBQUNFLGFBQU8sUUFBUSxLQUFSLEVBQWUsT0FBTyxPQUF0QixDQUFQO0FBQ0YsU0FBSyxhQUFMO0FBQ0UsYUFBTyxXQUFXLEtBQVgsRUFBa0IsT0FBTyxPQUF6QixDQUFQO0FBQ0YsU0FBSyxhQUFMO0FBQ0UsYUFBTyxXQUFXLEtBQVgsRUFBa0IsT0FBTyxPQUF6QixDQUFQO0FBQ0Y7QUFDRSxhQUFPLEtBQVA7QUFSSjtBQVVEOztrQkFFYyxXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIHJuZztcblxudmFyIGNyeXB0byA9IGdsb2JhbC5jcnlwdG8gfHwgZ2xvYmFsLm1zQ3J5cHRvOyAvLyBmb3IgSUUgMTFcbmlmIChjcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAvLyBXSEFUV0cgY3J5cHRvLWJhc2VkIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgLy8gTW9kZXJhdGVseSBmYXN0LCBoaWdoIHF1YWxpdHlcbiAgdmFyIF9ybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoX3JuZHM4KTtcbiAgICByZXR1cm4gX3JuZHM4O1xuICB9O1xufVxuXG5pZiAoIXJuZykge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciAgX3JuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgX3JuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9ybmRzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJuZztcblxuIiwiLy8gICAgIHV1aWQuanNcbi8vXG4vLyAgICAgQ29weXJpZ2h0IChjKSAyMDEwLTIwMTIgUm9iZXJ0IEtpZWZmZXJcbi8vICAgICBNSVQgTGljZW5zZSAtIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblxuLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIFdlIGZlYXR1cmVcbi8vIGRldGVjdCB0byBkZXRlcm1pbmUgdGhlIGJlc3QgUk5HIHNvdXJjZSwgbm9ybWFsaXppbmcgdG8gYSBmdW5jdGlvbiB0aGF0XG4vLyByZXR1cm5zIDEyOC1iaXRzIG9mIHJhbmRvbW5lc3MsIHNpbmNlIHRoYXQncyB3aGF0J3MgdXN1YWxseSByZXF1aXJlZFxudmFyIF9ybmcgPSByZXF1aXJlKCcuL3JuZycpO1xuXG4vLyBNYXBzIGZvciBudW1iZXIgPC0+IGhleCBzdHJpbmcgY29udmVyc2lvblxudmFyIF9ieXRlVG9IZXggPSBbXTtcbnZhciBfaGV4VG9CeXRlID0ge307XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIF9ieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xuICBfaGV4VG9CeXRlW19ieXRlVG9IZXhbaV1dID0gaTtcbn1cblxuLy8gKipgcGFyc2UoKWAgLSBQYXJzZSBhIFVVSUQgaW50byBpdCdzIGNvbXBvbmVudCBieXRlcyoqXG5mdW5jdGlvbiBwYXJzZShzLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IChidWYgJiYgb2Zmc2V0KSB8fCAwLCBpaSA9IDA7XG5cbiAgYnVmID0gYnVmIHx8IFtdO1xuICBzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvWzAtOWEtZl17Mn0vZywgZnVuY3Rpb24ob2N0KSB7XG4gICAgaWYgKGlpIDwgMTYpIHsgLy8gRG9uJ3Qgb3ZlcmZsb3chXG4gICAgICBidWZbaSArIGlpKytdID0gX2hleFRvQnl0ZVtvY3RdO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gWmVybyBvdXQgcmVtYWluaW5nIGJ5dGVzIGlmIHN0cmluZyB3YXMgc2hvcnRcbiAgd2hpbGUgKGlpIDwgMTYpIHtcbiAgICBidWZbaSArIGlpKytdID0gMDtcbiAgfVxuXG4gIHJldHVybiBidWY7XG59XG5cbi8vICoqYHVucGFyc2UoKWAgLSBDb252ZXJ0IFVVSUQgYnl0ZSBhcnJheSAoYWxhIHBhcnNlKCkpIGludG8gYSBzdHJpbmcqKlxuZnVuY3Rpb24gdW5wYXJzZShidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwLCBidGggPSBfYnl0ZVRvSGV4O1xuICByZXR1cm4gIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxuLy8gKipgdjEoKWAgLSBHZW5lcmF0ZSB0aW1lLWJhc2VkIFVVSUQqKlxuLy9cbi8vIEluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9MaW9zSy9VVUlELmpzXG4vLyBhbmQgaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L3V1aWQuaHRtbFxuXG4vLyByYW5kb20gIydzIHdlIG5lZWQgdG8gaW5pdCBub2RlIGFuZCBjbG9ja3NlcVxudmFyIF9zZWVkQnl0ZXMgPSBfcm5nKCk7XG5cbi8vIFBlciA0LjUsIGNyZWF0ZSBhbmQgNDgtYml0IG5vZGUgaWQsICg0NyByYW5kb20gYml0cyArIG11bHRpY2FzdCBiaXQgPSAxKVxudmFyIF9ub2RlSWQgPSBbXG4gIF9zZWVkQnl0ZXNbMF0gfCAweDAxLFxuICBfc2VlZEJ5dGVzWzFdLCBfc2VlZEJ5dGVzWzJdLCBfc2VlZEJ5dGVzWzNdLCBfc2VlZEJ5dGVzWzRdLCBfc2VlZEJ5dGVzWzVdXG5dO1xuXG4vLyBQZXIgNC4yLjIsIHJhbmRvbWl6ZSAoMTQgYml0KSBjbG9ja3NlcVxudmFyIF9jbG9ja3NlcSA9IChfc2VlZEJ5dGVzWzZdIDw8IDggfCBfc2VlZEJ5dGVzWzddKSAmIDB4M2ZmZjtcblxuLy8gUHJldmlvdXMgdXVpZCBjcmVhdGlvbiB0aW1lXG52YXIgX2xhc3RNU2VjcyA9IDAsIF9sYXN0TlNlY3MgPSAwO1xuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG5mdW5jdGlvbiB2MShvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcbiAgdmFyIGIgPSBidWYgfHwgW107XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIGNsb2Nrc2VxID0gb3B0aW9ucy5jbG9ja3NlcSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5jbG9ja3NlcSA6IF9jbG9ja3NlcTtcblxuICAvLyBVVUlEIHRpbWVzdGFtcHMgYXJlIDEwMCBuYW5vLXNlY29uZCB1bml0cyBzaW5jZSB0aGUgR3JlZ29yaWFuIGVwb2NoLFxuICAvLyAoMTU4Mi0xMC0xNSAwMDowMCkuICBKU051bWJlcnMgYXJlbid0IHByZWNpc2UgZW5vdWdoIGZvciB0aGlzLCBzb1xuICAvLyB0aW1lIGlzIGhhbmRsZWQgaW50ZXJuYWxseSBhcyAnbXNlY3MnIChpbnRlZ2VyIG1pbGxpc2Vjb25kcykgYW5kICduc2VjcydcbiAgLy8gKDEwMC1uYW5vc2Vjb25kcyBvZmZzZXQgZnJvbSBtc2Vjcykgc2luY2UgdW5peCBlcG9jaCwgMTk3MC0wMS0wMSAwMDowMC5cbiAgdmFyIG1zZWNzID0gb3B0aW9ucy5tc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5tc2VjcyA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIC8vIFBlciA0LjIuMS4yLCB1c2UgY291bnQgb2YgdXVpZCdzIGdlbmVyYXRlZCBkdXJpbmcgdGhlIGN1cnJlbnQgY2xvY2tcbiAgLy8gY3ljbGUgdG8gc2ltdWxhdGUgaGlnaGVyIHJlc29sdXRpb24gY2xvY2tcbiAgdmFyIG5zZWNzID0gb3B0aW9ucy5uc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5uc2VjcyA6IF9sYXN0TlNlY3MgKyAxO1xuXG4gIC8vIFRpbWUgc2luY2UgbGFzdCB1dWlkIGNyZWF0aW9uIChpbiBtc2VjcylcbiAgdmFyIGR0ID0gKG1zZWNzIC0gX2xhc3RNU2VjcykgKyAobnNlY3MgLSBfbGFzdE5TZWNzKS8xMDAwMDtcblxuICAvLyBQZXIgNC4yLjEuMiwgQnVtcCBjbG9ja3NlcSBvbiBjbG9jayByZWdyZXNzaW9uXG4gIGlmIChkdCA8IDAgJiYgb3B0aW9ucy5jbG9ja3NlcSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY2xvY2tzZXEgPSBjbG9ja3NlcSArIDEgJiAweDNmZmY7XG4gIH1cblxuICAvLyBSZXNldCBuc2VjcyBpZiBjbG9jayByZWdyZXNzZXMgKG5ldyBjbG9ja3NlcSkgb3Igd2UndmUgbW92ZWQgb250byBhIG5ld1xuICAvLyB0aW1lIGludGVydmFsXG4gIGlmICgoZHQgPCAwIHx8IG1zZWNzID4gX2xhc3RNU2VjcykgJiYgb3B0aW9ucy5uc2VjcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbnNlY3MgPSAwO1xuICB9XG5cbiAgLy8gUGVyIDQuMi4xLjIgVGhyb3cgZXJyb3IgaWYgdG9vIG1hbnkgdXVpZHMgYXJlIHJlcXVlc3RlZFxuICBpZiAobnNlY3MgPj0gMTAwMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3V1aWQudjEoKTogQ2FuXFwndCBjcmVhdGUgbW9yZSB0aGFuIDEwTSB1dWlkcy9zZWMnKTtcbiAgfVxuXG4gIF9sYXN0TVNlY3MgPSBtc2VjcztcbiAgX2xhc3ROU2VjcyA9IG5zZWNzO1xuICBfY2xvY2tzZXEgPSBjbG9ja3NlcTtcblxuICAvLyBQZXIgNC4xLjQgLSBDb252ZXJ0IGZyb20gdW5peCBlcG9jaCB0byBHcmVnb3JpYW4gZXBvY2hcbiAgbXNlY3MgKz0gMTIyMTkyOTI4MDAwMDA7XG5cbiAgLy8gYHRpbWVfbG93YFxuICB2YXIgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XG4gIGJbaSsrXSA9IHRsID4+PiAyNCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiAxNiAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdGwgJiAweGZmO1xuXG4gIC8vIGB0aW1lX21pZGBcbiAgdmFyIHRtaCA9IChtc2VjcyAvIDB4MTAwMDAwMDAwICogMTAwMDApICYgMHhmZmZmZmZmO1xuICBiW2krK10gPSB0bWggPj4+IDggJiAweGZmO1xuICBiW2krK10gPSB0bWggJiAweGZmO1xuXG4gIC8vIGB0aW1lX2hpZ2hfYW5kX3ZlcnNpb25gXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMjQgJiAweGYgfCAweDEwOyAvLyBpbmNsdWRlIHZlcnNpb25cbiAgYltpKytdID0gdG1oID4+PiAxNiAmIDB4ZmY7XG5cbiAgLy8gYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgIChQZXIgNC4yLjIgLSBpbmNsdWRlIHZhcmlhbnQpXG4gIGJbaSsrXSA9IGNsb2Nrc2VxID4+PiA4IHwgMHg4MDtcblxuICAvLyBgY2xvY2tfc2VxX2xvd2BcbiAgYltpKytdID0gY2xvY2tzZXEgJiAweGZmO1xuXG4gIC8vIGBub2RlYFxuICB2YXIgbm9kZSA9IG9wdGlvbnMubm9kZSB8fCBfbm9kZUlkO1xuICBmb3IgKHZhciBuID0gMDsgbiA8IDY7IG4rKykge1xuICAgIGJbaSArIG5dID0gbm9kZVtuXTtcbiAgfVxuXG4gIHJldHVybiBidWYgPyBidWYgOiB1bnBhcnNlKGIpO1xufVxuXG4vLyAqKmB2NCgpYCAtIEdlbmVyYXRlIHJhbmRvbSBVVUlEKipcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgLy8gRGVwcmVjYXRlZCAtICdmb3JtYXQnIGFyZ3VtZW50LCBhcyBzdXBwb3J0ZWQgaW4gdjEuMlxuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IF9ybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgaWkrKykge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IHVucGFyc2Uocm5kcyk7XG59XG5cbi8vIEV4cG9ydCBwdWJsaWMgQVBJXG52YXIgdXVpZCA9IHY0O1xudXVpZC52MSA9IHYxO1xudXVpZC52NCA9IHY0O1xudXVpZC5wYXJzZSA9IHBhcnNlO1xudXVpZC51bnBhcnNlID0gdW5wYXJzZTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dWlkO1xuIiwiaW1wb3J0IFN0YXRlTWFuYWdlciBmcm9tICcuL3N0YXRlX21hbmFnZXInXG5pbXBvcnQgdGFza1JlZHVjZXIgZnJvbSAnLi90YXNrX3JlZHVjZXInXG5cbmxldCBjb21iaW5lZFJlZHVjZXIgPSBTdGF0ZU1hbmFnZXIuY29tYmluZVJlZHVjZXJzKHtcbiAgdGFyZWFzOiB0YXNrUmVkdWNlclxufSlcbmxldCBzdG9yZSA9IFN0YXRlTWFuYWdlci5zdG9yZUZhY3RvcnkoY29tYmluZWRSZWR1Y2VyKVxubGV0IGFwcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2RvLWxpc3QnKVxubGV0IGZvcm1UYXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXJlYScpXG5sZXQgY291bnRlckRvbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb3VudGVyJylcblxuZm9ybVRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChldmVudCkgPT4ge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gIHN0b3JlLmRpc3BhdGNoKHtcbiAgICB0eXBlOiAnVEFTS19BREQnLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHRleHQ6IGV2ZW50LnRhcmdldFswXS52YWx1ZVxuICAgIH1cbiAgfSlcbiAgZXZlbnQudGFyZ2V0WzBdLnZhbHVlID0gJydcbn0pXG5cbmFwcC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICBpZiAoZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT0gXCJjb250ZW50XCIpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgc3RvcmUuZGlzcGF0Y2goe1xuICAgICAgdHlwZTogJ1RBU0tfVE9HR0xFJyxcbiAgICAgIHBheWxvYWQ6IGV2ZW50LnRhcmdldC5wYXJlbnRFbGVtZW50LmlkXG4gICAgfSlcbiAgfVxufSlcblxuYXBwLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gIGlmIChldmVudC50YXJnZXQgJiYgZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PSBcInRvZG8tcmVtb3ZlXCIpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgc3RvcmUuZGlzcGF0Y2goe1xuICAgICAgdHlwZTogJ1RBU0tfUkVNT1ZFJyxcbiAgICAgIHBheWxvYWQ6IGV2ZW50LnRhcmdldC5wYXJlbnRFbGVtZW50LmlkXG4gICAgfSlcbiAgfVxufSlcblxuXG5zdG9yZS5zdWJzY3JpYmUoZnVuY3Rpb24gKCkge1xuICBsZXQgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpXG4gIHJlbmRlclRhcmVhcyhzdGF0ZS50YXJlYXMsIGFwcClcbn0pXG5cbnN0b3JlLnN1YnNjcmliZShmdW5jdGlvbiAoKSB7XG4gIHJlbmRlckNvdW50ZXIoc3RvcmUuZ2V0U3RhdGUoKS50YXJlYXMubGVuZ3RoLCBjb3VudGVyRG9tKVxufSlcblxuZnVuY3Rpb24gcmVuZGVyVGFyZWFzICh0YXJlYXMsIGRvbUVsZW1lbnQpIHtcbiAgZG9tRWxlbWVudC5pbm5lckhUTUwgPSBgXG4gICAgPHVsPlxuICAgICAgJHtsaXN0YURlVGFyZWFzKHRhcmVhcyl9XG4gICAgPC91bD5cbiAgYFxufVxuXG5mdW5jdGlvbiBsaXN0YURlVGFyZWFzICh0YXJlYXMpIHtcbiAgcmV0dXJuIHRhcmVhcy5yZWR1Y2UoKGh0bWxBY3VtdWxhZG8sIHRhcmVhLCB0YXJlYXMpID0+IHtcbiAgICByZXR1cm4gYFxuICAgICAgJHtodG1sQWN1bXVsYWRvfVxuICAgICAgPGxpIGlkPVwiJHt0YXJlYS5pZH1cIiBjbGFzcz1cIiR7KHRhcmVhLmRvbmUpID8gJ3JlYWR5Jzonbm90LXJlYWR5J31cIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJjb250ZW50XCI+XG4gICAgICAgICAgJHt0YXJlYS50ZXh0fVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJ0b2RvLXJlbW92ZVwiPlxuICAgICAgICAgIFxcdTI2MTJcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2xpPlxuICAgIGBcbiAgfSwgJycpXG59IFxuXG5mdW5jdGlvbiByZW5kZXJDb3VudGVyIChjb3VudCwgZG9tRWxlbWVudCkge1xuICBkb21FbGVtZW50LmlubmVySFRNTCA9IGBcbiAgICA8aDY+XG4gICAgICBDYW50aWRhZCB0YXJlYXM6ICR7Y291bnR9XG4gICAgPC9oNj5cbiAgYFxufVxuXG4iLCJcbi8qXG4gKiByZWR1Y2VyczogT2JqZXRvXG4gKiB7XG4gKiAga2V5IC8vIGxhIHBhcnRlIGRlbCBzdGF0ZSBtb2RpZmljYVxuICogIGZ1bmN0aW9uXG4gKiB9IFxuXG4gKlx0RWplbXBsb1xuICoge1xuICogIHRhc2tzOiB0YXNrUmVkdWNlclxuICogIHVzZXI6IHVzZXJSZWR1Y2VyXG4gKiAgcG9zdHM6IHBvc3RSZWR1Y2VyXG4gKiB9XG4gKlxuICogTGEgaWRlYSBlcyBpZGVudGlmaWNhciBsYSBwYXJ0ZSBkZWwgc3RhdGUgcXVlIHZhIGEgbWFuZWphciBjYWRhIHJlZHVjZXJzXG4gKiBkZSBtYW5lcmEgZGUgZ2VuZXJhciB1bmEgZnVuY2lvbiBkZSByZWR1Y2Npb24gcXVlIGNvbWJpbmUgeSByZWFsaXplIHVuYSBjb21wb3NpY2lvblxuICogcGFyYSBtYW5lamFyIGVsIHN0YXRlXG4gKiB7XG4gKiAgdGFza3M6IFtdLFxuICogIHVzZXI6IHt9LFxuICogIHBvc3RzOiBbXSxcbiAqICBnZW5lcmFsOiB7XG4gKiAgICBpc0xvZ2luOiBib29sLFxuICogIH1cbiAqIH1cbiAqXG4gKi9cblxuZnVuY3Rpb24gY29tYmluZVJlZHVjZXJzIChyZWR1Y2Vycykge1xuXHQvLyBMYSBmdW5jaW9uIGNvbW5iaW5lIHJlZHVjZXJzIGRlYmUgdG9tYXIgZWwgb2JqZXRvIHF1ZSBtYXBlYSBcblx0Ly8gbGEgcGFydGUgZGVsIHN0YXRlIHkgbGEgZnVuY2lvbiBxdWUgc2UgZW5jYXJnYSBkZSBtYW5lZ2FyIGFjY2lvbmVzIGRlIGRpY2hhIFxuXHQvLyBwYXJ0ZVxuXG5cdC8vIERpY2hhIGZ1bmNpb24gYWwgaWd1YWwgcXVlIGN1YWxxdWllciByZWR1Y2VyIHRvbWEgY29tbyBwYXJhbWV0cm9zIGxhIGFjdGlvbiB5IGVsIHN0YXRlXG5cdC8vIFkgcmV0b3JuYSB1biBlc3RhZG8gbnVldm9cblxuICByZXR1cm4gKGFjdGlvbiwgc3RhdGUpID0+IHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmVkdWNlcnMpLnJlZHVjZSgoQ29tYmluZVN0YXRlLCBrZXkpID0+IHtcbiAgICAgIENvbWJpbmVTdGF0ZVtrZXldID0gcmVkdWNlcnNba2V5XShhY3Rpb24sIHN0YXRlW2tleV0pXG5cdFx0XHRyZXR1cm4gQ29tYmluZVN0YXRlXG4gICAgfSwge30pXG4gIH1cbn1cblxuZnVuY3Rpb24gc3RvcmVGYWN0b3J5IChyZWR1Y2VyKSB7XG4gIGxldCBzdGF0ZSA9IHt9XG4gIGxldCBsaXN0ZW5lcnMgPSBbXVxuXG4gIGZ1bmN0aW9uIGRpc3BhdGNoIChhY3Rpb24pIHtcbiAgICBzdGF0ZSA9IHJlZHVjZXIoYWN0aW9uLCBzdGF0ZSlcbiAgICBsaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGxpc3RlbmVyKClcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gc3Vic2NyaWJlIChjYWxsYmFjaykge1xuICAgIGxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuZmlsdGVyKChsaXN0ZW5lcnMpID0+IHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycyAhPT0gY2FsbGJhY2tcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0U3RhdGUgKCkge1xuICAgIHJldHVybiBzdGF0ZVxuICB9IFxuICBcbiAgcmV0dXJuIHtcbiAgICBkaXNwYXRjaCxcbiAgICBnZXRTdGF0ZSxcbiAgICBsaXN0ZW5cbiAgfVxufVxuXG5jb25zdCBTdGF0ZU1hbmFnZXIgPSB7XG4gIHN0b3JlRmFjdG9yeSxcbiAgY29tYmluZVJlZHVjZXJzXG59XG5cbmV4cG9ydCBkZWZhdWx0IFN0YXRlTWFuYWdlclxuIiwiaW1wb3J0IHV1aWQgZnJvbSAndXVpZCdcblxuZnVuY3Rpb24gYWRkVGFzayAoc3RhdGUsIG5ld1Rhc2spIHtcbiAgT2JqZWN0LmFzc2lnbihuZXdUYXNrLCB7XG4gICAgaWQ6IHV1aWQudjEoKSxcbiAgICBkb25lOiBmYWxzZVxuICB9KVxuICByZXR1cm4gW10uY29uY2F0KHN0YXRlLCBbbmV3VGFza10pXG59XG5cbmZ1bmN0aW9uIHJlbW92ZVRhc2sgKHN0YXRlLCBpZCkge1xuICByZXR1cm4gc3RhdGUuZmlsdGVyKCh0YXNrKSA9PiB7XG4gICAgcmV0dXJuIHRhc2suaWQgIT09IGlkXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVRhc2soc3RhdGUsIGlkKSB7XG4gIGNvbnN0IGluZGV4ID0gc3RhdGUuZmluZEluZGV4KHRhc2sgPT4gdGFzay5pZCA9PT0gaWQpXG4gIHJldHVybiBbXS5jb25jYXQoXG4gICAgc3RhdGUuc2xpY2UoMCwgaW5kZXgpLFxuICAgIHRvZ2dsZVN0YXR1cyhzdGF0ZVtpbmRleF0pLFxuICAgIHN0YXRlLnNsaWNlKGluZGV4ICsgMSlcbiAgKVxufVxuXG5mdW5jdGlvbiB0b2dnbGVTdGF0dXMgKHRhc2spIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRhc2ssIHtcbiAgICBkb25lOiAhdGFzay5kb25lXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHRhc2tSZWR1Y2VyIChhY3Rpb24sIHN0YXRlID0gW10pIHtcbiAgYWN0aW9uID0gKCFhY3Rpb24pID8ge3R5cGU6IG51bGx9IDogYWN0aW9uXG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdUQVNLX0FERCc6XG4gICAgICByZXR1cm4gYWRkVGFzayhzdGF0ZSwgYWN0aW9uLnBheWxvYWQpXG4gICAgY2FzZSAnVEFTS19SRU1PVkUnOlxuICAgICAgcmV0dXJuIHJlbW92ZVRhc2soc3RhdGUsIGFjdGlvbi5wYXlsb2FkKVxuICAgIGNhc2UgJ1RBU0tfVE9HR0xFJzpcbiAgICAgIHJldHVybiB0b2dnbGVUYXNrKHN0YXRlLCBhY3Rpb24ucGF5bG9hZClcbiAgICBkZWZhdWx0OiBcbiAgICAgIHJldHVybiBzdGF0ZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHRhc2tSZWR1Y2VyXG4iXX0=
