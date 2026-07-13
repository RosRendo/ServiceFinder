import { ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
export declare class IsFutureDateConstraint implements ValidatorConstraintInterface {
    validate(dateStr: string): boolean;
    defaultMessage(): string;
}
export declare function IsFutureDate(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
