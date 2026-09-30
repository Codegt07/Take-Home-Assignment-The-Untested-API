const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

test('creates a task with default values', () => {
  const task = taskService.create({
    title: 'Learn Jest',
  });

  expect(task.title).toBe('Learn Jest');
  expect(task.description).toBe('');
  expect(task.status).toBe('todo');
  expect(task.priority).toBe('medium');
  expect(task.dueDate).toBeNull();
  expect(task.completedAt).toBeNull();
  expect(task.id).toBeDefined();
  expect(task.createdAt).toBeDefined();
});

test('creates a task with provided values', () => {
  const task = taskService.create({
    title: 'Finish assignment',
    description: 'Write all required tests',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-10-01',
  });

  expect(task.title).toBe('Finish assignment');
  expect(task.description).toBe('Write all required tests');
  expect(task.status).toBe('in_progress');
  expect(task.priority).toBe('high');
  expect(task.dueDate).toBe('2026-10-01');
});

test('returns all created tasks', () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });

  const tasks = taskService.getAll();

  expect(tasks).toHaveLength(2);
  expect(tasks[0].title).toBe('Task 1');
  expect(tasks[1].title).toBe('Task 2');
});

test('returns a copy of the tasks array', () => {
  taskService.create({ title: 'Task 1' });

  const tasks = taskService.getAll();

  tasks.push({ title: 'Fake Task' });

  expect(taskService.getAll()).toHaveLength(1);
});

test('finds a task by id', () => {
  const createdTask = taskService.create({
    title: 'Find this task',
  });

  const foundTask = taskService.findById(createdTask.id);

  expect(foundTask).toEqual(createdTask);
});

test('returns undefined when task id does not exist', () => {
  const result = taskService.findById('does-not-exist');

  expect(result).toBeUndefined();
});

test('returns tasks matching the status', () => {
  taskService.create({
    title: 'Todo task',
    status: 'todo',
  });

  taskService.create({
    title: 'Progress task',
    status: 'in_progress',
  });

  taskService.create({
    title: 'Done task',
    status: 'done',
  });

  const tasks = taskService.getByStatus('todo');

  expect(tasks).toHaveLength(1);
  expect(tasks[0].title).toBe('Todo task');
});

// Regression test for the partial status matching bug.
// Status filtering should match the exact status value.


test('does not return tasks for a partial status match', () => {
  taskService.create({
    title: 'In progress task',
    status: 'in_progress',
  });

const tasks = taskService.getByStatus('in');

expect(tasks).toHaveLength(0);

});

// Regression test for the pagination off-by-one bug.
// Page numbers are 1-based, so page 1 should return the first tasks.

test('returns the first page of tasks', () => {
  taskService.create({ title: 'Task 1' });

  taskService.create({ title: 'Task 2' });

  taskService.create({ title: 'Task 3' });

  taskService.create({ title: 'Task 4' });

  const tasks = taskService.getPaginated(1, 2);

  expect(tasks).toHaveLength(2);

  expect(tasks[0].title).toBe('Task 1');

  expect(tasks[1].title).toBe('Task 2');
});

test('returns correct task counts by status', () => {
  taskService.create({
    title: 'Todo 1',
    status: 'todo',
  });

  taskService.create({
    title: 'Todo 2',
    status: 'todo',
  });

  taskService.create({
    title: 'In progress',
    status: 'in_progress',
  });

  taskService.create({
    title: 'Completed',
    status: 'done',
  });

  const stats = taskService.getStats();

  expect(stats.todo).toBe(2);
  expect(stats.in_progress).toBe(1);
  expect(stats.done).toBe(1);
});

test('counts overdue unfinished tasks', () => {
  taskService.create({
    title: 'Overdue task',
    status: 'todo',
    dueDate: '2020-01-01',
  });

  taskService.create({
    title: 'Completed overdue task',
    status: 'done',
    dueDate: '2020-01-01',
  });

  taskService.create({
    title: 'Future task',
    status: 'todo',
    dueDate: '2099-01-01',
  });

  const stats = taskService.getStats();

  expect(stats.overdue).toBe(1);
});

test('updates an existing task', () => {
  const task = taskService.create({
    title: 'Old title',
    priority: 'low',
  });

  const updatedTask = taskService.update(task.id, {
    title: 'New title',
    priority: 'high',
  });

  expect(updatedTask.title).toBe('New title');
  expect(updatedTask.priority).toBe('high');
  expect(updatedTask.status).toBe('todo');
});

test('returns null when updating a task that does not exist', () => {
  const result = taskService.update('does-not-exist', {
    title: 'New title',
  });

  expect(result).toBeNull();
});

test('removes an existing task', () => {
  const task = taskService.create({
    title: 'Delete this task',
  });

  const result = taskService.remove(task.id);

  expect(result).toBe(true);
  expect(taskService.findById(task.id)).toBeUndefined();
});

test('returns false when removing a task that does not exist', () => {
  const result = taskService.remove('does-not-exist');

  expect(result).toBe(false);
});

test('completes an existing task', () => {
  const task = taskService.create({
    title: 'Complete this task',
    status: 'in_progress',
    priority: 'high',
  });

  const completedTask = taskService.completeTask(task.id);

  expect(completedTask.status).toBe('done');
  expect(completedTask.priority).toBe('medium');
  expect(completedTask.completedAt).toBeDefined();
});

test('returns null when completing a task that does not exist', () => {
  const result = taskService.completeTask('does-not-exist');

  expect(result).toBeNull();
});

test('stores the completed task with done status', () => {
  const task = taskService.create({
    title: 'Finish this task',
  });

  taskService.completeTask(task.id);

  const updatedTask = taskService.findById(task.id);

  expect(updatedTask.status).toBe('done');
  expect(updatedTask.completedAt).toBeDefined();
});

test('ignores tasks with an unknown status when calculating statistics', () => {
  taskService.create({
    title: 'Unknown status task',
    status: 'unknown',
  });

  const stats = taskService.getStats();

  expect(stats.todo).toBe(0);
  expect(stats.in_progress).toBe(0);
  expect(stats.done).toBe(0);
  expect(stats.overdue).toBe(0);
});