import { Request, Response } from 'express';
import { RegisterUserUseCase } from '@application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/LoginUserUseCase';
import { successResponse } from '../utils/response';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, displayName, password } = req.body;
      
      const user = await this.registerUserUseCase.execute({
        email,
        displayName,
        password,
      });

      res.status(201).json(successResponse(user));
    } catch (error) {
      // Error will be handled by errorHandler middleware
      throw error;
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const result = await this.loginUserUseCase.execute({
        email,
        password,
      });

      res.status(200).json(successResponse(result));
    } catch (error) {
      // Error will be handled by errorHandler middleware
      throw error;
    }
  }
}