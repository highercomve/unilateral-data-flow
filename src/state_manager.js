
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

function combineReducers (reducers) {
	// La funcion comnbine reducers debe tomar el objeto que mapea 
	// la parte del state y la funcion que se encarga de manegar acciones de dicha 
	// parte

	// Dicha funcion al igual que cualquier reducer toma como parametros la action y el state
	// Y retorna un estado nuevo

  return (action, state) => {
    return Object.keys(reducers).reduce((CombineState, key) => {
      CombineState[key] = reducers[key](action, state[key])
			return CombineState
    }, {})
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

  function subscribe (callback) {
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
    subscribe
  }
}

const StateManager = {
  storeFactory,
  combineReducers
}

export default StateManager
