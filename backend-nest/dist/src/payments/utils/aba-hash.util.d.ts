export declare function generateAbaHash(params: {
    req_time: string;
    merchant_id: string;
    tran_id: string;
    amount: string;
    items?: string;
    shipping?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    type?: string;
    payment_option?: string;
    return_url?: string;
    cancel_url?: string;
    continue_success_url?: string;
    return_params?: string;
}, apiKey: string): string;
