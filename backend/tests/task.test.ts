import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { cleanDatabase, createTestUser, createTestTask } from './helpers';

let accessToken: string;

beforeEach(async () => {
  await cleanDatabase();
  const user = await createTestUser();
  accessToken = user.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /tasks', () => {
  it('should create a task', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New task', description: 'Description', priority: 'HIGH' })
      .expect(201);

    expect(res.body.title).toBe('New task');
    expect(res.body.status).toBe('TODO');
    expect(res.body.priority).toBe('HIGH');
    expect(res.body).toHaveProperty('id');
  });

  it('should reject missing title', async () => {
    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'No title' })
      .expect(400);
  });

  it('should reject without auth', async () => {
    await request(app)
      .post('/tasks')
      .send({ title: 'Unauthorized' })
      .expect(401);
  });
});

describe('GET /tasks', () => {
  it('should list tasks with pagination', async () => {
    for (let i = 0; i < 15; i++) {
      await createTestTask(accessToken, { title: `Task ${i}` });
    }

    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.tasks).toHaveLength(10);
    expect(res.body.pagination.total).toBe(15);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it('should filter by status', async () => {
    await createTestTask(accessToken, { title: 'Todo', status: 'TODO' });
    await createTestTask(accessToken, { title: 'Done', status: 'DONE' });

    const res = await request(app)
      .get('/tasks?status=DONE')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe('Done');
  });

  it('should search by title', async () => {
    await createTestTask(accessToken, { title: 'Buy groceries' });
    await createTestTask(accessToken, { title: 'Clean house' });

    const res = await request(app)
      .get('/tasks?search=Buy')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe('Buy groceries');
  });

  it('should return empty for no match', async () => {
    const res = await request(app)
      .get('/tasks?search=nonexistent')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.tasks).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('should not show other users tasks', async () => {
    await createTestTask(accessToken, { title: 'My task' });

    const user2 = await createTestUser({ email: 'user2@test.com' });
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .expect(200);

    expect(res.body.tasks).toHaveLength(0);
  });
});

describe('GET /tasks/:id', () => {
  it('should get a task by id', async () => {
    const task = await createTestTask(accessToken);
    const res = await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(task.id);
    expect(res.body.title).toBe(task.title);
  });

  it('should return 404 for non-existent task', async () => {
    await request(app)
      .get('/tasks/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('should return 404 for other users task', async () => {
    const task = await createTestTask(accessToken);
    const user2 = await createTestUser({ email: 'user2@test.com' });

    await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .expect(404);
  });
});

describe('PATCH /tasks/:id', () => {
  it('should update a task', async () => {
    const task = await createTestTask(accessToken);
    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated', priority: 'LOW' })
      .expect(200);

    expect(res.body.title).toBe('Updated');
    expect(res.body.priority).toBe('LOW');
  });

  it('should return 404 for other users task', async () => {
    const task = await createTestTask(accessToken);
    const user2 = await createTestUser({ email: 'user2@test.com' });

    await request(app)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .send({ title: 'Hack' })
      .expect(404);
  });
});

describe('DELETE /tasks/:id', () => {
  it('should delete a task', async () => {
    const task = await createTestTask(accessToken);
    await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Verify deleted
    await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('should return 404 for other users task', async () => {
    const task = await createTestTask(accessToken);
    const user2 = await createTestUser({ email: 'user2@test.com' });

    await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .expect(404);
  });
});

describe('PATCH /tasks/:id/toggle', () => {
  it('should cycle TODO -> IN_PROGRESS', async () => {
    const task = await createTestTask(accessToken, { status: 'TODO' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('should cycle IN_PROGRESS -> DONE', async () => {
    const task = await createTestTask(accessToken, { status: 'IN_PROGRESS' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('DONE');
  });

  it('should cycle DONE -> TODO', async () => {
    const task = await createTestTask(accessToken, { status: 'DONE' });
    const res = await request(app)
      .patch(`/tasks/${task.id}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('TODO');
  });
});
