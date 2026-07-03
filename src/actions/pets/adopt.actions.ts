import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createAdoptionRequest } from '../../lib/strapi';

export const createAdoptionRequestAction = defineAction({
  accept: 'form',
  input: z.object({
    pet: z.string().min(1, 'Se requiere el ID de la mascota'),
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Email invalido'),
    phone: z.string().min(8, 'El telefono debe tener al menos 8 caracteres'),
    address: z.string().min(5, 'La direccion debe tener al menos 5 caracteres'),
    neighborhood: z.string().min(2, 'El barrio es obligatorio'),
    age: z.coerce.number().int().min(18, 'Debes ser mayor de edad para continuar'),
    adoptionReason: z.string().min(10, 'Cuentanos un poco mas sobre tu interes de adopcion').max(1000),
  }),
  async handler({ pet, name, email, phone, address, neighborhood, age, adoptionReason }) {
    return createAdoptionRequest({
      pet,
      name,
      email,
      phone,
      address,
      neighborhood,
      age,
      adoptionReason,
    });
  },
});
