import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

export async function cleanDatabase() {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(overrides = {}) {
  const userData = {
    email: 'test@test.com',
    name: 'Test User',
    password: 'password123',
    ...overrides,
  };

  const res = await request(app)
    .post('/auth/register')
    .send(userData)
    .expect(201);

  return {
    user: res.body.user,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
  };
}

export async function createTestTask(
  accessToken: string,
  overrides = {}
) {
  const taskData = {
    title: 'Test Task',
    description: 'A test task',
    priority: 'MEDIUM',
    status: 'TODO',
    ...overrides,
  };

  const res = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(taskData)
    .expect(201);

  return res.body;
}
