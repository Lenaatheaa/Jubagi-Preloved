import { z } from 'zod';

const productBaseSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255, 'Judul terlalu panjang'),
  description: z.string().max(5000, 'Deskripsi terlalu panjang').optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif').optional().nullable(),
  type: z.enum(['jual', 'hibah']),
  condition: z.enum(['brand_new', 'like_new', 'lightly_used', 'well_used', 'heavily_used']),
  categoryId: z.union([z.string(), z.number()]).optional().nullable(),
  size: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  dealMethod: z.enum(['pickup', 'delivery', 'both']).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  images: z.array(z.string().url()).optional(),
});

export const createProductSchema = productBaseSchema.refine(
  (data) => data.type !== 'jual' || (data.price !== null && data.price !== undefined && data.price > 0),
  { message: 'Harga wajib diisi untuk produk yang dijual', path: ['price'] }
);

export const updateProductSchema = productBaseSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
