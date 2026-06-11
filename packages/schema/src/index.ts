import { z } from 'zod'

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per: z.coerce.number().int().positive().max(100).default(10),
})

export const ItemSchema = z.object({
  name: z.string().min(1).max(100),
})

export const ItemUpdateSchema = ItemSchema.partial()
