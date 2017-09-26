import uuid from 'uuid'

function addTask (state, newTask) {
  Object.assign(newTask, {
    id: uuid.v1(),
    done: false
  })
  return [].concat(state, [newTask])
}

function removeTask (state, id) {
  return state.filter((task) => {
    return task.id !== id
  })
}

function toggleTask(state, id) {
  const index = state.findIndex(task => task.id === id)
  return [].concat(
    state.slice(0, index),
    toggleStatus(state[index]),
    state.slice(index + 1)
  )
}

function toggleStatus (task) {
  return Object.assign({}, task, {
    done: !task.done
  })
}

function taskReducer (action, state = []) {
  action = (!action) ? {type: null} : action
  switch (action.type) {
    case 'TASK_ADD':
      return addTask(state, action.payload)
    case 'TASK_REMOVE':
      return removeTask(state, action.payload)
    case 'TASK_TOGGLE':
      return toggleTask(state, action.payload)
    default: 
      return state
  }
}

export default taskReducer
