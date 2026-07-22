import { z } from 'zod';

export const createOfferSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform(Number),
  offerPrice: z.number().positive('Harga tawar harus lebih dari 0').max(10000000, 'Tawaran maksimal adalah Rp 10.000.000'),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
