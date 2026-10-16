import type { GuestRecord } from "./models";
export function guestDTO(g: GuestRecord & { _id: { toString(): string } }) {
  return {
    id: g._id.toString(),
    name: g.name,
    email: g.email,
    phone: g.phone,
    notes: g.notes,
    guestGroupId: g.guestGroupId?.toString() ?? null,
  };
}
export type GuestDTO = ReturnType<typeof guestDTO>;
