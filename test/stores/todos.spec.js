import expect from 'expect'
import Todos from '../../src/task_reducer'

function initialState () {
  console.log('Initial state must be []')
  expect(
    Todos(undefined, [])
  ).toEqual([])
}

function ifAddTodo() {
  console.log('With one todo must be [TODO{}]')
  const text = "nueva todo"
  const state = Todos({ type: "TASK_ADD", payload: {text: text}}, [])
  expect(state[0].text).toEqual(text)
  expect(state[0].done).toEqual(false)
}

initialState()
ifAddTodo()

console.log('All test pass')
