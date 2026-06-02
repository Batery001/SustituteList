import { Registration } from "@/models/Registration";

export async function markRegistrationPaid(
  registrationId: string,
  options?: { tbkAuthorizationCode?: string }
): Promise<boolean> {
  const registration = await Registration.findById(registrationId);
  if (!registration) return false;

  if (registration.paymentStatus === "paid") return true;

  registration.paymentStatus = "paid";
  registration.paidAt = new Date();
  if (options?.tbkAuthorizationCode) {
    registration.tbkAuthorizationCode = options.tbkAuthorizationCode;
  }
  await registration.save();
  return true;
}
