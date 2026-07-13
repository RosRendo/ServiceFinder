export type UserRole = 'customer' | 'company_admin' | 'admin' | 'staff'
export type UserStatus = 'active' | 'inactive' | 'suspended'



export interface User {
  id: string
  fullName: string
  email: string
  phone: string | null
  avatar: string
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  ownedCompanies?: { id: string }[]
}


export interface UserResponse {
  user: User
}
