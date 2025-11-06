import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  CollectionReference,
  DocumentData,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from '@angular/fire/storage';
import { Observable, from, map } from 'rxjs';
import { Candidate } from '../models/candidate.model';

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  private candidatesCollection: CollectionReference<DocumentData>;
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);

  constructor() {
    this.candidatesCollection = collection(this.firestore, 'candidates');
  }

  // Get all candidates
  getAllCandidates(): Observable<Candidate[]> {
    return collectionData(this.candidatesCollection, {
      idField: 'id',
    }) as Observable<Candidate[]>;
  }

  // Read (Single): Get a single candidate by ID
  getCandidateById(id: string): Observable<Candidate | null> {
    const docRef = doc(this.firestore, `candidates/${id}`);
    return from(getDoc(docRef)).pipe(
      map((snapshot) => {
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as Candidate;
        }
        return null;
      })
    );
  }

  // Create: Adds a new candidate document to Firestore
  addCandidate(data: Omit<Candidate, 'id'>): Observable<DocumentReference> {
    // This method now only handles saving data, not file uploads.
    return from(addDoc(this.candidatesCollection, data));
  }

  // Update: Updates an existing candidate document
  updateCandidate(id: string, data: Partial<Candidate>): Observable<void> {
    const docRef = doc(this.firestore, `candidates/${id}`);
    return from(updateDoc(docRef, data));
  }

  // Delete: Deletes a candidate document
  deleteCandidate(id: string): Observable<void> {
    const docRef = doc(this.firestore, `candidates/${id}`);
    return from(deleteDoc(docRef));
  }

  // Upload: Uploads a profile image and returns the download URL
  uploadProfileImage(file: File): Observable<string> {
    const filePath = `candidate-images/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Convert the promise-based getDownloadURL into an Observable
    return new Observable<string>((observer) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // You can observe progress here if needed
        },
        (error) => {
          console.error('Error uploading image:', error);
          observer.error(error);
        },
        () => {
          // On success, get the download URL and complete the observable
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              observer.next(downloadURL);
              observer.complete();
            })
            .catch((error) => {
              observer.error(error);
            });
        }
      );
    });
  }
}
