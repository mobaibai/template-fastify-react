export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface PaginationParams {
  page: number
  per: number
}

export interface PaginationMeta {
  page: number
  per: number
  total: number
  totalPage: number
}

export interface PaginatedResponse<T> {
  list: T[]
  pagination: PaginationMeta
}

export interface Item {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
