import StateManager from './store'
import taskReducer from './task_reducer'

let combinedReducer = StateManager.combineReducers({
  tareas: taskReducer
})
let store = StateManager.storeFactory(combinedReducer)
let app = document.getElementById('root')
let formTarea = document.getElementById('tarea')
let counterDom = document.getElementById('counter')

formTarea.addEventListener('submit', (event) => {
  event.preventDefault()
  store.dispatch({
    type: 'TASK_ADD',
    payload: {
      text: event.target[0].value
    }
  })
})

app.addEventListener('click', (event) => {
  event.preventDefault()
  store.dispatch({
    type: 'TASK_REMOVE',
    payload: event.target.id
  })
})

store.listen(function () {
  let state = store.getState()
  renderTareas(state.tareas, app)
})

store.listen(function () {
  renderCounter(store.getState().tareas.length, counterDom)
})

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
      <li id="${tarea.id}">${tarea.text}</li>
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

console.log('formTarea')
console.log(app)
