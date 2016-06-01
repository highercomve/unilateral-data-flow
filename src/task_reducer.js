function addTask (state, newTask) {
  Object.assign(newTask, {
    id: Math.random() * 16 + 'abc-ad'
  })
  state.push(newTask)
  return state
}

function removeTask (state, id) {
  return state.filter((task) => {
    return task.id !== id
  })
}

function taskReducer (action, state = []) {
  switch (action.type) {
    case 'TASK_ADD':
      return addTask(state, action.payload)
    case 'TASK_REMOVE':
      return removeTask(state, action.payload)
    default: 
      return state
  }
}

export default taskReducer
