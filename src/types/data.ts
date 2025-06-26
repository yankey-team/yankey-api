// Auth Payloads
export interface UserAuthPayload {
  displayName: string;
  phoneNumber: string;
}

export interface OperatorAuthPayload {
  username: string;
  password: string;
}

export interface JWTPayload {
  id: string;
  type: 'user' | 'operator';
  merchantId: string;
}

// Office Payloads
export interface OfficeSignUpPayload {
  name: string;
  domain: string;
  loyaltyPercentage: number;
  admin: {
    username: string;
    password: string;
    displayName: string;
  };
}

export interface OfficeSignInPayload {
  username: string;
  password: string;
  domain: string;
}

export interface OperatorCreatePayload {
  username: string;
  password: string;
  displayName: string;
}

export interface OperatorUpdatePayload {
  displayName?: string;
  password?: string;
}

export interface UserCreatePayload {
  displayName: string;
  phoneNumber: string;
}

export interface UserUpdatePayload {
  displayName?: string;
  phoneNumber?: string;
}

export interface MerchantUpdatePayload {
  name?: string;
  loyaltyPercentage?: number;
}