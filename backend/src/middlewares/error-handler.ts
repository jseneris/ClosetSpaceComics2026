import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/custom-error';

// Central error handler; keeps controllers free of try/catch boilerplate
// (the legacy C# controllers each caught Exception and returned BadRequest).
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }

  console.error(err);
  return res.status(400).send({ errors: [{ message: err.message || 'Something went wrong' }] });
}
