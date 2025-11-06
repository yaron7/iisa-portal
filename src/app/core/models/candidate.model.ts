export interface Candidate {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  city: string;
  perfectCandidateReason: string;
  profileImageUrl: string;
  hobbies?: string;
  registrationDate?: Date | string;
  lastUpdated?: Date | string;
}
