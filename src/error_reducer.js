function errorReducer (action, state = '') {
    action = (!action) ? {type: null} : action
    switch (action.type) {
      case 'INPUT_CANT_BE_EMPTY':
        return 'Input can\'t be empty'
      default: 
        return state
    }
  }
  
  export default errorReducer