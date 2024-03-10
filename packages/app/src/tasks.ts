import invariant from 'tiny-invariant'
import {
  ItemType,
  Task,
  TaskId,
  TaskType,
} from './types.js'

export const tasks: Record<TaskId, Task> = {}

function addTask(task: Task): void {
  invariant(!tasks[task.id])
  tasks[task.id] = task
}

let nextTaskId = 0
function getNextTaskId(): TaskId {
  return `${nextTaskId++}`
}

addTask({
  id: getNextTaskId(),
  type: TaskType.enum.Mine,
  itemType: ItemType.enum.Stone,
  count: 20,
  progress: 0,
})

addTask({
  id: getNextTaskId(),
  type: TaskType.enum.Mine,
  itemType: ItemType.enum.IronOre,
  count: 20,
  progress: 0,
})

addTask({
  id: getNextTaskId(),
  type: TaskType.enum.Mine,
  itemType: ItemType.enum.Coal,
  count: 20,
  progress: 0,
})
