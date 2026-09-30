const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

// GET /tasks

test('GET /tasks returns all tasks', async () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });

  const response = await request(app)
    .get('/tasks');

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(2);
  expect(response.body[0].title).toBe('Task 1');
  expect(response.body[1].title).toBe('Task 2');
});

test('GET /tasks returns an empty array when there are no tasks', async () => {
  const response = await request(app)
    .get('/tasks');

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual([]);
});

// GET /tasks?status=

test('GET /tasks with status filter returns matching tasks', async () => {
  taskService.create({
    title: 'Todo task',
    status: 'todo',
  });

  taskService.create({
    title: 'In progress task',
    status: 'in_progress',
  });

  const response = await request(app)
    .get('/tasks')
    .query({ status: 'todo' });

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(response.body[0].title).toBe('Todo task');
});

test('GET /tasks with a status that has no tasks returns an empty array', async () => {
  taskService.create({
    title: 'Todo task',
    status: 'todo',
  });

  const response = await request(app)
    .get('/tasks')
    .query({ status: 'done' });

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual([]);
});

// GET /tasks?page=&limit=

test('GET /tasks with pagination returns the requested page', async () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });
  taskService.create({ title: 'Task 3' });
  taskService.create({ title: 'Task 4' });

  const response = await request(app)
    .get('/tasks')
    .query({ page: 1, limit: 2 });

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(2);
  expect(response.body[0].title).toBe('Task 1');
  expect(response.body[1].title).toBe('Task 2');
});

test('GET /tasks with pagination returns an empty array when page has no tasks', async () => {
  taskService.create({ title: 'Task 1' });

  const response = await request(app)
    .get('/tasks')
    .query({ page: 10, limit: 2 });

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual([]);
});

test('GET /tasks uses default page when page is invalid', async () => {
  taskService.create({ title: 'Task 1' });

  const response = await request(app)
    .get('/tasks')
    .query({ page: 'invalid' });

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(response.body[0].title).toBe('Task 1');
});

test('GET /tasks uses default limit when limit is invalid', async () => {
  taskService.create({ title: 'Task 1' });

  const response = await request(app)
    .get('/tasks')
    .query({ limit: 'invalid' });

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(response.body[0].title).toBe('Task 1');
});

// GET /tasks/stats

test('GET /tasks/stats returns task statistics', async () => {
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

  const response = await request(app)
    .get('/tasks/stats');

  expect(response.statusCode).toBe(200);
  expect(response.body.todo).toBe(1);
  expect(response.body.in_progress).toBe(1);
  expect(response.body.done).toBe(1);
  expect(response.body.overdue).toBe(0);
});

test('GET /tasks/stats returns zero counts when there are no tasks', async () => {
  const response = await request(app)
    .get('/tasks/stats');

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
  });
});

// POST /tasks

test('POST /tasks creates a task', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      title: 'New task',
      description: 'Task description',
      priority: 'high',
    });

  expect(response.statusCode).toBe(201);
  expect(response.body.title).toBe('New task');
  expect(response.body.description).toBe('Task description');
  expect(response.body.priority).toBe('high');
  expect(response.body.status).toBe('todo');
  expect(response.body.id).toBeDefined();
});

test('POST /tasks rejects a request without a title', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      description: 'Missing title',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'title is required and must be a non-empty string'
  );
});

test('POST /tasks rejects an invalid status', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      title: 'Invalid task',
      status: 'invalid',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'status must be one of: todo, in_progress, done'
  );
});

// PUT /tasks/:id

test('PUT /tasks/:id updates an existing task', async () => {
  const task = taskService.create({
    title: 'Old title',
    priority: 'low',
  });

  const response = await request(app)
    .put(`/tasks/${task.id}`)
    .send({
      title: 'Updated title',
      priority: 'high',
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.title).toBe('Updated title');
  expect(response.body.priority).toBe('high');
});

test('PUT /tasks/:id returns 404 when task does not exist', async () => {
  const response = await request(app)
    .put('/tasks/does-not-exist')
    .send({
      title: 'Updated title',
    });

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({
    error: 'Task not found',
  });
});

test('PUT /tasks/:id rejects an invalid title', async () => {
  const task = taskService.create({
    title: 'Existing task',
  });

  const response = await request(app)
    .put(`/tasks/${task.id}`)
    .send({
      title: '',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'title must be a non-empty string'
  );
});

// DELETE /tasks/:id

test('DELETE /tasks/:id deletes an existing task', async () => {
  const task = taskService.create({
    title: 'Delete this task',
  });

  const response = await request(app)
    .delete(`/tasks/${task.id}`);

  expect(response.statusCode).toBe(204);
  expect(response.body).toEqual({});
  expect(taskService.findById(task.id)).toBeUndefined();
});

test('DELETE /tasks/:id returns 404 when task does not exist', async () => {
  const response = await request(app)
    .delete('/tasks/does-not-exist');

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({
    error: 'Task not found',
  });
});

// PATCH /tasks/:id/complete

test('PATCH /tasks/:id/complete completes an existing task', async () => {
  const task = taskService.create({
    title: 'Complete this task',
    status: 'in_progress',
    priority: 'high',
  });

  const response = await request(app)
    .patch(`/tasks/${task.id}/complete`);

  expect(response.statusCode).toBe(200);
  expect(response.body.status).toBe('done');
  expect(response.body.priority).toBe('medium');
  expect(response.body.completedAt).toBeDefined();
});

test('PATCH /tasks/:id/complete returns 404 when task does not exist', async () => {
  const response = await request(app)
    .patch('/tasks/does-not-exist/complete');

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({
    error: 'Task not found',
  });
});

// PATCH /tasks/:id/assign

test('PATCH /tasks/:id/assign assigns a task to a user', async () => {
  const task = taskService.create({
    title: 'Write tests',
  });

  const response = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({
      assignee: 'Rahul',
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.assignee).toBe('Rahul');
  expect(response.body.id).toBe(task.id);
});

test('PATCH /tasks/:id/assign returns 404 when task does not exist', async () => {
  const response = await request(app)
    .patch('/tasks/does-not-exist/assign')
    .send({
      assignee: 'Rahul',
    });

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({
    error: 'Task not found',
  });
});

test('PATCH /tasks/:id/assign rejects a missing assignee', async () => {
  const task = taskService.create({
    title: 'Write tests',
  });

  const response = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({});

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'assignee is required and must be a non-empty string'
  );
});

test('PATCH /tasks/:id/assign rejects an empty assignee', async () => {
  const task = taskService.create({
    title: 'Write tests',
  });

  const response = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({
      assignee: '   ',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'assignee is required and must be a non-empty string'
  );
});

test('PATCH /tasks/:id/assign allows reassignment', async () => {
  const task = taskService.create({
    title: 'Write tests',
  });

  await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({
      assignee: 'Rahul',
    });

  const response = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({
      assignee: 'Aman',
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.assignee).toBe('Aman');
});

test('POST /tasks rejects an invalid priority', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      title: 'Invalid priority task',
      priority: 'urgent',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'priority must be one of: low, medium, high'
  );
});

test('POST /tasks rejects an invalid due date', async () => {
  const response = await request(app)
    .post('/tasks')
    .send({
      title: 'Invalid date task',
      dueDate: 'not-a-date',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'dueDate must be a valid ISO date string'
  );
});

test('PUT /tasks/:id rejects an invalid status', async () => {
  const task = taskService.create({
    title: 'Existing task',
  });

  const response = await request(app)
    .put(`/tasks/${task.id}`)
    .send({
      status: 'invalid',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'status must be one of: todo, in_progress, done'
  );
});

test('PUT /tasks/:id rejects an invalid priority', async () => {
  const task = taskService.create({
    title: 'Existing task',
  });

  const response = await request(app)
    .put(`/tasks/${task.id}`)
    .send({
      priority: 'urgent',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'priority must be one of: low, medium, high'
  );
});

test('PUT /tasks/:id rejects an invalid due date', async () => {
  const task = taskService.create({
    title: 'Existing task',
  });

  const response = await request(app)
    .put(`/tasks/${task.id}`)
    .send({
      dueDate: 'not-a-date',
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe(
    'dueDate must be a valid ISO date string'
  );
});

test('PATCH /tasks/:id/assign trims surrounding whitespace from assignee', async () => {
  const task = taskService.create({
    title: 'Assign task',
  });

  const response = await request(app)
    .patch(`/tasks/${task.id}/assign`)
    .send({
      assignee: '  Rahul  ',
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.assignee).toBe('Rahul');
});