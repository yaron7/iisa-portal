import { Timestamp } from 'firebase/firestore';
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
  registrationDate?: Timestamp | Date;
  lastUpdated?: Timestamp | Date;
}
