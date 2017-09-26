import StateManager from './state_manager'
import taskReducer from './task_reducer'
import errorReducer from './error_reducer'

let combinedReducer = StateManager.combineReducers({
  tareas: taskReducer,
  error: errorReducer
})
let store = StateManager.storeFactory(combinedReducer)
let app = document.getElementById('todo-list')
let formTarea = document.getElementById('tarea')
let counterDom = document.getElementById('counter')

formTarea.addEventListener('submit', (event) => {
  event.preventDefault()
  var value = event.target[0].value.trim()
  if (value && value !==  '') {
    store.dispatch({
      type: 'TASK_ADD',
      payload: {
        text: value
      }
    })
  } else {
    store.dispatch({
      type: 'INPUT_CANT_BE_EMPTY',
    })
  }
  event.target[0].value = ''
})

app.addEventListener('click', (event) => {
  if (event.target && event.target.className == "content") {
    event.preventDefault()
    store.dispatch({
      type: 'TASK_TOGGLE',
      payload: event.target.parentElement.id
    })
  }
})

app.addEventListener('click', (event) => {
  if (event.target && event.target.className == "todo-remove") {
    event.preventDefault()
    store.dispatch({
      type: 'TASK_REMOVE',
      payload: event.target.parentElement.id
    })
  }
})


store.subscribe(function () {
  let state = store.getState()
  renderTareas(state.tareas, app)
})

store.subscribe(function () {
  renderCounter(store.getState().tareas.length, counterDom)
})

store.subscribe(function () {
  renderError(store.getState().error, formTarea)
})

function renderError(message, elem) {
  var errorElm = elem.querySelector('.error')
  if (errorElm && (message || message !== '')) {
    errorElm.innerHTML = message
  }
}

function renderTareas (tareas, domElement) {
  domElement.innerHTML = `
    <ul>
      ${listaDeTareas(tareas)}
    </ul>
  `
}

function listaDeTareas (tareas) {
  return tareas.reduce((htmlAcumulado, tarea, tareas) => {
    return `
      ${htmlAcumulado}
      <li id="${tarea.id}" class="${(tarea.done) ? 'ready':'not-ready'}">
        <span class="content">
          ${tarea.text}
        </span>
        <button class="todo-remove">
          \u2612
        </button>
      </li>
    `
  }, '')
} 

function renderCounter (count, domElement) {
  domElement.innerHTML = `
    <h6>
      Cantidad tareas: ${count}
    </h6>
  `
}

