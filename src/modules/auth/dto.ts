export type UserDTO = { id: string; displayName: string; email: string };
export function toUserDTO(user: {
  _id: { toString(): string };
  displayName: string;
  email: string;
}): UserDTO {
  return {
    id: user._id.toString(),
    displayName: user.displayName,
    email: user.email,
  };
}
