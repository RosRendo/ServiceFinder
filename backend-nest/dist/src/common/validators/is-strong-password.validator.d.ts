import { ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
export declare class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
    validate(password: string): boolean;
    defaultMessage(): string;
}
export declare function IsStrongPasswordCustom(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
