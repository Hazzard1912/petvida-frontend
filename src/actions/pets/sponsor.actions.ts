import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createSponsorRequest } from '../../lib/strapi';

export const createSponsorRequestAction = defineAction({
  accept: 'form',
  input: z.object({
    pet: z.string().min(1, 'Selecciona la mascota que deseas apadrinar'),
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Email invalido'),
    phone: z.string().min(8, 'El telefono debe tener al menos 8 caracteres'),
    address: z.string().min(5, 'La direccion debe tener al menos 5 caracteres'),
    monthlyAmount: z.coerce.number().int().positive('El monto debe ser mayor a 0'),
  }),
  async handler({ pet, name, email, phone, address, monthlyAmount }) {
    return createSponsorRequest({
      pet,
      name,
      email,
      phone,
      address,
      monthlyAmount,
    });
  },
});
