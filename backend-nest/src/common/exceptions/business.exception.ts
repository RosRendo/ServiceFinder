import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: number = HttpStatus.BAD_REQUEST) {
    super(
      {
        success: false,
        message,
        error: 'BusinessLogicError',
        statusCode,
      },
      statusCode,
    );
  }
}
