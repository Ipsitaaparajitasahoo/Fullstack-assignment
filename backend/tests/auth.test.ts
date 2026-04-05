import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { cleanDatabase, createTestUser } from './helpers';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'new@test.com', name: 'New User', password: 'password123' })
      .expect(201);

    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('new@test.com');
    expect(res.body.user.name).toBe('New User');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should reject duplicate email', async () => {
    await createTestUser();
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', name: 'Dup User', password: 'password123' })
      .expect(409);

    expect(res.body.message).toBe('Email already registered');
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'bad-email', name: 'User', password: 'password123' })
      .expect(400);

    expect(res.body.message).toBe('Validation error');
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'x@test.com', name: 'User', password: 'short' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /auth/login', () => {
  it('should login with correct credentials', async () => {
    await createTestUser();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(200);

    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should reject wrong password', async () => {
    await createTestUser();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' })
      .expect(401);

    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'none@test.com', password: 'password123' })
      .expect(401);

    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('POST /auth/refresh', () => {
  it('should return new tokens with valid refresh token', async () => {
    const { refreshToken } = await createTestUser();
    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.refreshToken).not.toBe(refreshToken); // rotated with unique jti
  });

  it('should reject invalid refresh token', async () => {
    await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401);
  });

  it('should rotate tokens on each refresh', async () => {
    const { refreshToken: token1 } = await createTestUser();

    const res1 = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: token1 })
      .expect(200);

    const token2 = res1.body.refreshToken;
    expect(token2).not.toBe(token1);

    // New token should work
    const res2 = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: token2 })
      .expect(200);

    expect(res2.body.refreshToken).not.toBe(token2);
  });
});

describe('POST /auth/logout', () => {
  it('should logout successfully', async () => {
    const { accessToken } = await createTestUser();
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.message).toBe('Logged out successfully');
  });

  it('should reject without token', async () => {
    await request(app)
      .post('/auth/logout')
      .expect(401);
  });

  it('should invalidate refresh token after logout', async () => {
    const { accessToken, refreshToken } = await createTestUser();
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});
