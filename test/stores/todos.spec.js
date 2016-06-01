import expect from 'expect'
import Todos from '../../src/components/todos/store'

function initialState () {
  console.log('Initial state must be []')
  expect(
    Todos(undefined, {})
  ).toEqual([])
}

function ifAddTodo() {
  console.log('With one todo must be [TODO{}]')
  expect(
    Todos([], { type: "ADD_TODO", text: "nueva todo"})
  ).toEqual([{id: 0, text: "nueva todo", completed: false}])
}

initialState()
ifAddTodo()

console.log('All test pass')
