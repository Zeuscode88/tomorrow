export const ADMIN_EMAILS = [
  'jonatha2ngs@gmail.com',
  'lumanegrah88@gmail.com',
] as const;

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === clean);
}
