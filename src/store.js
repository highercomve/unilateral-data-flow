
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

function combineReducers (reducers) {
  return (action, state) => {
    // [tasks, user, posts]
    Object.keys(reducers).forEach((key) => {
      state[key] = reducers[key](action, state[key])
    })
    return state
  }
}

function storeFactory (reducer) {
  let state = {}
  let listeners = []

  function dispatch (action) {
    state = reducer(action, state)
    listeners.forEach((listener) => {
      listener()
    })
  }

  function listen (callback) {
    listeners.push(callback)
    return () => {
      listeners = listeners.filter((listeners) => {
        return listeners !== callback
      })
    }
  }

  function getState () {
    return state
  } 
  
  return {
    dispatch,
    getState,
    listen
  }
}

const StateManager = {
  storeFactory,
  combineReducers
}

export default StateManager
