import { z } from 'zod';

export const createTransactionSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform(String),
  shippingMethod: z.string().optional().default('jne_reg'),
  paymentMethod: z.string().optional().default('qris'),
  offerPrice: z.number().positive().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
