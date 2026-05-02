import { Request, Response } from 'express';
import { RegisterUserUseCase } from '@application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/LoginUserUseCase';
import { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase';
import { DeleteUserUseCase } from '@application/use-cases/DeleteUserUseCase';
import { successResponse } from '../utils/response';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
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

  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.listUsersUseCase.execute();
      const userRepresentations = users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      }));
      res.status(200).json(successResponse(userRepresentations));
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteUserUseCase.execute({ userId: String(id) });
      res.status(204).send();
    } catch (error) {
      throw error;
    }
  }
}
