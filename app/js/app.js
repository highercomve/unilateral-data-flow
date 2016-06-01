(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _task_reducer = require('./task_reducer');

var _task_reducer2 = _interopRequireDefault(_task_reducer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var combinedReducer = _store2.default.combineReducers({
  tareas: _task_reducer2.default
});
var store = _store2.default.storeFactory(combinedReducer);
var app = document.getElementById('root');
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
});

app.addEventListener('click', function (event) {
  event.preventDefault();
  store.dispatch({
    type: 'TASK_REMOVE',
    payload: event.target.id
  });
});

store.listen(function () {
  var state = store.getState();
  console.log(state);
  renderTareas(state.tareas, app);
});

store.listen(function () {
  renderCounter(store.getState().tareas.length, counterDom);
});

function renderTareas(tareas, domElement) {
  domElement.innerHTML = '\n    <ul>\n      ' + listaDeTareas(tareas) + '\n    </ul>\n  ';
}

function listaDeTareas(tareas) {
  return tareas.reduce(function (htmlAcumulado, tarea, tareas) {
    return '\n      ' + htmlAcumulado + '\n      <li id="' + tarea.id + '">' + tarea.text + '</li>\n    ';
  }, '');
}

function renderCounter(count, domElement) {
  domElement.innerHTML = '\n    <h6>\n      Cantidad tareas: ' + count + '\n    </h6>\n  ';
}

console.log('formTarea');
console.log(app);

},{"./store":2,"./task_reducer":3}],2:[function(require,module,exports){
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
 *
 * {
 *  tasks: taskReducer
 *  user: userReducer
 *  posts: postReducer
 * }
 *
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
  return function (action, state) {
    // [tasks, user, posts]
    Object.keys(reducers).forEach(function (key) {
      state[key] = reducers[key](action, state[key]);
    });
    return state;
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

  function listen(callback) {
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

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function addTask(state, newTask) {
  Object.assign(newTask, {
    id: Math.random() * 16 + 'abc-ad'
  });
  state.push(newTask);
  return state;
}

function removeTask(state, id) {
  return state.filter(function (task) {
    return task.id !== id;
  });
}

function taskReducer(action) {
  var state = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  switch (action.type) {
    case 'TASK_ADD':
      return addTask(state, action.payload);
    case 'TASK_REMOVE':
      return removeTask(state, action.payload);
    default:
      return state;
  }
}

exports.default = taskReducer;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL3N0b3JlLmpzIiwic3JjL3Rhc2tfcmVkdWNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBSSxrQkFBa0IsZ0JBQWEsZUFBYixDQUE2QjtBQUNqRCxnQ0FEaUQ7Q0FBN0IsQ0FBbEI7QUFHSixJQUFJLFFBQVEsZ0JBQWEsWUFBYixDQUEwQixlQUExQixDQUFSO0FBQ0osSUFBSSxNQUFNLFNBQVMsY0FBVCxDQUF3QixNQUF4QixDQUFOO0FBQ0osSUFBSSxZQUFZLFNBQVMsY0FBVCxDQUF3QixPQUF4QixDQUFaO0FBQ0osSUFBSSxhQUFhLFNBQVMsY0FBVCxDQUF3QixTQUF4QixDQUFiOztBQUVKLFVBQVUsZ0JBQVYsQ0FBMkIsUUFBM0IsRUFBcUMsVUFBQyxLQUFELEVBQVc7QUFDOUMsUUFBTSxjQUFOLEdBRDhDO0FBRTlDLFFBQU0sUUFBTixDQUFlO0FBQ2IsVUFBTSxVQUFOO0FBQ0EsYUFBUztBQUNQLFlBQU0sTUFBTSxNQUFOLENBQWEsQ0FBYixFQUFnQixLQUFoQjtLQURSO0dBRkYsRUFGOEM7Q0FBWCxDQUFyQzs7QUFVQSxJQUFJLGdCQUFKLENBQXFCLE9BQXJCLEVBQThCLFVBQUMsS0FBRCxFQUFXO0FBQ3ZDLFFBQU0sY0FBTixHQUR1QztBQUV2QyxRQUFNLFFBQU4sQ0FBZTtBQUNiLFVBQU0sYUFBTjtBQUNBLGFBQVMsTUFBTSxNQUFOLENBQWEsRUFBYjtHQUZYLEVBRnVDO0NBQVgsQ0FBOUI7O0FBUUEsTUFBTSxNQUFOLENBQWEsWUFBWTtBQUN2QixNQUFJLFFBQVEsTUFBTSxRQUFOLEVBQVIsQ0FEbUI7QUFFdkIsVUFBUSxHQUFSLENBQVksS0FBWixFQUZ1QjtBQUd2QixlQUFhLE1BQU0sTUFBTixFQUFjLEdBQTNCLEVBSHVCO0NBQVosQ0FBYjs7QUFNQSxNQUFNLE1BQU4sQ0FB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USxPQUFPLElBQVA7QUFDTixTQUFLLFVBQUw7QUFDRSxhQUFPLFFBQVEsS0FBUixFQUFlLE9BQU8sT0FBUCxDQUF0QixDQURGO0FBREYsU0FHTyxhQUFMO0FBQ0UsYUFBTyxXQUFXLEtBQVgsRUFBa0IsT0FBTyxPQUFQLENBQXpCLENBREY7QUFIRjtBQU1JLGFBQU8sS0FBUCxDQURGO0FBTEYsR0FEd0M7Q0FBMUM7O2tCQVdlIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBTdGF0ZU1hbmFnZXIgZnJvbSAnLi9zdG9yZSdcbmltcG9ydCB0YXNrUmVkdWNlciBmcm9tICcuL3Rhc2tfcmVkdWNlcidcblxubGV0IGNvbWJpbmVkUmVkdWNlciA9IFN0YXRlTWFuYWdlci5jb21iaW5lUmVkdWNlcnMoe1xuICB0YXJlYXM6IHRhc2tSZWR1Y2VyXG59KVxubGV0IHN0b3JlID0gU3RhdGVNYW5hZ2VyLnN0b3JlRmFjdG9yeShjb21iaW5lZFJlZHVjZXIpXG5sZXQgYXBwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKVxubGV0IGZvcm1UYXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXJlYScpXG5sZXQgY291bnRlckRvbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb3VudGVyJylcblxuZm9ybVRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChldmVudCkgPT4ge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gIHN0b3JlLmRpc3BhdGNoKHtcbiAgICB0eXBlOiAnVEFTS19BREQnLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHRleHQ6IGV2ZW50LnRhcmdldFswXS52YWx1ZVxuICAgIH1cbiAgfSlcbn0pXG5cbmFwcC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gIHN0b3JlLmRpc3BhdGNoKHtcbiAgICB0eXBlOiAnVEFTS19SRU1PVkUnLFxuICAgIHBheWxvYWQ6IGV2ZW50LnRhcmdldC5pZFxuICB9KVxufSlcblxuc3RvcmUubGlzdGVuKGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0YXRlID0gc3RvcmUuZ2V0U3RhdGUoKVxuICBjb25zb2xlLmxvZyhzdGF0ZSlcbiAgcmVuZGVyVGFyZWFzKHN0YXRlLnRhcmVhcywgYXBwKVxufSlcblxuc3RvcmUubGlzdGVuKGZ1bmN0aW9uICgpIHtcbiAgcmVuZGVyQ291bnRlcihzdG9yZS5nZXRTdGF0ZSgpLnRhcmVhcy5sZW5ndGgsIGNvdW50ZXJEb20pXG59KVxuXG5mdW5jdGlvbiByZW5kZXJUYXJlYXMgKHRhcmVhcywgZG9tRWxlbWVudCkge1xuICBkb21FbGVtZW50LmlubmVySFRNTCA9IGBcbiAgICA8dWw+XG4gICAgICAke2xpc3RhRGVUYXJlYXModGFyZWFzKX1cbiAgICA8L3VsPlxuICBgXG59XG5cbmZ1bmN0aW9uIGxpc3RhRGVUYXJlYXMgKHRhcmVhcykge1xuICByZXR1cm4gdGFyZWFzLnJlZHVjZSgoaHRtbEFjdW11bGFkbywgdGFyZWEsIHRhcmVhcykgPT4ge1xuICAgIHJldHVybiBgXG4gICAgICAke2h0bWxBY3VtdWxhZG99XG4gICAgICA8bGkgaWQ9XCIke3RhcmVhLmlkfVwiPiR7dGFyZWEudGV4dH08L2xpPlxuICAgIGBcbiAgfSwgJycpXG59IFxuXG5mdW5jdGlvbiByZW5kZXJDb3VudGVyIChjb3VudCwgZG9tRWxlbWVudCkge1xuICBkb21FbGVtZW50LmlubmVySFRNTCA9IGBcbiAgICA8aDY+XG4gICAgICBDYW50aWRhZCB0YXJlYXM6ICR7Y291bnR9XG4gICAgPC9oNj5cbiAgYFxufVxuXG5jb25zb2xlLmxvZygnZm9ybVRhcmVhJylcbmNvbnNvbGUubG9nKGFwcClcbiIsIlxuLypcbiAqIHJlZHVjZXJzOiBPYmpldG9cbiAqIHtcbiAqICBrZXkgLy8gbGEgcGFydGUgZGVsIHN0YXRlIG1vZGlmaWNhXG4gKiAgZnVuY3Rpb25cbiAqIH0gXG4gKlxuICoge1xuICogIHRhc2tzOiB0YXNrUmVkdWNlclxuICogIHVzZXI6IHVzZXJSZWR1Y2VyXG4gKiAgcG9zdHM6IHBvc3RSZWR1Y2VyXG4gKiB9XG4gKlxuICoge1xuICogIHRhc2tzOiBbXSxcbiAqICB1c2VyOiB7fSxcbiAqICBwb3N0czogW10sXG4gKiAgZ2VuZXJhbDoge1xuICogICAgaXNMb2dpbjogYm9vbCxcbiAqICB9XG4gKiB9XG4gKlxuICovXG5cbmZ1bmN0aW9uIGNvbWJpbmVSZWR1Y2VycyAocmVkdWNlcnMpIHtcbiAgcmV0dXJuIChhY3Rpb24sIHN0YXRlKSA9PiB7XG4gICAgLy8gW3Rhc2tzLCB1c2VyLCBwb3N0c11cbiAgICBPYmplY3Qua2V5cyhyZWR1Y2VycykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBzdGF0ZVtrZXldID0gcmVkdWNlcnNba2V5XShhY3Rpb24sIHN0YXRlW2tleV0pXG4gICAgfSlcbiAgICByZXR1cm4gc3RhdGVcbiAgfVxufVxuXG5mdW5jdGlvbiBzdG9yZUZhY3RvcnkgKHJlZHVjZXIpIHtcbiAgbGV0IHN0YXRlID0ge31cbiAgbGV0IGxpc3RlbmVycyA9IFtdXG5cbiAgZnVuY3Rpb24gZGlzcGF0Y2ggKGFjdGlvbikge1xuICAgIHN0YXRlID0gcmVkdWNlcihhY3Rpb24sIHN0YXRlKVxuICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgbGlzdGVuZXIoKVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBsaXN0ZW4gKGNhbGxiYWNrKSB7XG4gICAgbGlzdGVuZXJzLnB1c2goY2FsbGJhY2spXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5maWx0ZXIoKGxpc3RlbmVycykgPT4ge1xuICAgICAgICByZXR1cm4gbGlzdGVuZXJzICE9PSBjYWxsYmFja1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHN0YXRlXG4gIH0gXG4gIFxuICByZXR1cm4ge1xuICAgIGRpc3BhdGNoLFxuICAgIGdldFN0YXRlLFxuICAgIGxpc3RlblxuICB9XG59XG5cbmNvbnN0IFN0YXRlTWFuYWdlciA9IHtcbiAgc3RvcmVGYWN0b3J5LFxuICBjb21iaW5lUmVkdWNlcnNcbn1cblxuZXhwb3J0IGRlZmF1bHQgU3RhdGVNYW5hZ2VyXG4iLCJmdW5jdGlvbiBhZGRUYXNrIChzdGF0ZSwgbmV3VGFzaykge1xuICBPYmplY3QuYXNzaWduKG5ld1Rhc2ssIHtcbiAgICBpZDogTWF0aC5yYW5kb20oKSAqIDE2ICsgJ2FiYy1hZCdcbiAgfSlcbiAgc3RhdGUucHVzaChuZXdUYXNrKVxuICByZXR1cm4gc3RhdGVcbn1cblxuZnVuY3Rpb24gcmVtb3ZlVGFzayAoc3RhdGUsIGlkKSB7XG4gIHJldHVybiBzdGF0ZS5maWx0ZXIoKHRhc2spID0+IHtcbiAgICByZXR1cm4gdGFzay5pZCAhPT0gaWRcbiAgfSlcbn1cblxuZnVuY3Rpb24gdGFza1JlZHVjZXIgKGFjdGlvbiwgc3RhdGUgPSBbXSkge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnVEFTS19BREQnOlxuICAgICAgcmV0dXJuIGFkZFRhc2soc3RhdGUsIGFjdGlvbi5wYXlsb2FkKVxuICAgIGNhc2UgJ1RBU0tfUkVNT1ZFJzpcbiAgICAgIHJldHVybiByZW1vdmVUYXNrKHN0YXRlLCBhY3Rpb24ucGF5bG9hZClcbiAgICBkZWZhdWx0OiBcbiAgICAgIHJldHVybiBzdGF0ZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHRhc2tSZWR1Y2VyXG4iXX0=
