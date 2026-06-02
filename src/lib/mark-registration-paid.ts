import { Registration } from "@/models/Registration";

export async function markRegistrationPaid(
  registrationId: string,
  options?: { mpPaymentId?: string }
): Promise<boolean> {
  const registration = await Registration.findById(registrationId);
  if (!registration) return false;

  if (registration.paymentStatus === "paid") return true;

  registration.paymentStatus = "paid";
  registration.paidAt = new Date();
  if (options?.mpPaymentId) {
    registration.mpPaymentId = options.mpPaymentId;
  }
  await registration.save();
  return true;
}
