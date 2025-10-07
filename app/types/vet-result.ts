/**
 * @property {string} name - Full name of the veterinarian.
 * @property {string} id - Unique identifier for the veterinarian.
 * @property {string} preferredName - Preferred name of the veterinarian.
 * @property {string} class - Class of the veterinarian.
 * @property {string} licenseStatus - Current status of the veterinarian's license.
 * @property {string} specialty - Specialty area of the veterinarian.
 * @property {string} notes - Additional notes about the veterinarian.
 * @property {string} firstName - First name of the veterinarian.
 * @property {string} lastName - Last name of the veterinarian.
 * @property {string} zip - ZIP code of the veterinarian's practice.
 * @property {string} licenseNumber - License number of the veterinarian.
 * @property {string} status - Current status of the veterinarian.
 * @property {string} expiration - Expiration date of the veterinarian's license.
 * @property {string} licenseType - Type of license held by the veterinarian.   
 */






export interface VetResult {
  name: string;
  id?: string;
  preferredName?: string;
  class?: string;
  licenseStatus?: string;
  specialty?: string;
  notes?: string;
  firstName?: string;
  lastName?: string;
  zip?: number;
  licenseNumber?: string;
  status?: string;
  expiration?: string;
  licenseType?: string;
}
