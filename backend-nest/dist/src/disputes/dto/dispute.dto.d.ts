export declare class CreateDisputeDto {
    type: string;
    description: string;
    photos?: string[];
}
export declare class RespondToDisputeDto {
    response: string;
}
export declare class ResolveDisputeDto {
    decision: string;
    refundAmount?: number;
}
