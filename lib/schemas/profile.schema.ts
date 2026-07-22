import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor telepon tidak valid (contoh: 08123456789)')
    .optional(),
  address: z.string().min(10, 'Alamat terlalu pendek').max(500).optional(),
  avatar: z.string().url('URL avatar tidak valid').optional().or(z.literal('')),
  notificationsEnabled: z.boolean().optional(),
  privacyProfilePublic: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
