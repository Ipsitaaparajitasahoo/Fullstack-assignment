import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  res.status(200).json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.userId!);
  res.status(200).json({ message: 'Logged out successfully' });
}
