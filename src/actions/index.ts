import { createAdoptionRequestAction } from './pets/adopt.actions';
import { createSponsorRequestAction } from './pets/sponsor.actions';

export const server = {
  createAdoptionRequestAction,
  createSponsorRequestAction,
};
