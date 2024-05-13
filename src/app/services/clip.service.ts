import { Injectable } from '@angular/core';
import {
  AngularFirestore, AngularFirestoreCollection, DocumentReference,
  QuerySnapshot
} from '@angular/fire/compat/firestore';
import IClip from '../models/clips.models';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { switchMap, map, last } from 'rxjs';
import { of, BehaviorSubject, combineLatest } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router
} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ClipService implements Resolve<IClip | null> {
  public clipsCollection: AngularFirestoreCollection<IClip>
  pageClips: IClip[] = []
  pendingReq = false

  constructor(
    // Inject AngularFirestore to interact with Firestore database
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router: Router
  ) {
    // Initialize the collection reference for 'clips' in Firestore
    this.clipsCollection = db.collection('clips');
  }

  // Method to create a new clip in Firestore
  // Receives a data object of type IClip(inserts document into clips collection)
  createClip(data: IClip): Promise<DocumentReference<IClip>> {
    // Add the data to the 'clips' collection in Firestore
    // Firestore generates a unique ID for the document
    return this.clipsCollection.add(data);
  }

  // returns an obseravable
  // querys the user's clips from FireBase
  getUserClips(sort$: BehaviorSubject<string>) {
    return combineLatest([
      this.auth.user, // first item in values array 
      sort$ // 2nd item pushed by SORT Observable
    ]).pipe(
      switchMap(values => {
        const [user, sort] = values

        if (!user) {
          return of([])
        }

        const query = this.clipsCollection.ref.where(
          'uid', '==', user.uid
        ).orderBy(
          'timestamp',
          sort === '1' ? 'desc' : 'asc'
        )

        return query.get()
      }),
      map(snapshot => (snapshot as QuerySnapshot<IClip>).docs)
    )
  }

  // updates the document once we select it(selecting a clip)
  updateClip(id: string, title: string) {
    return this.clipsCollection.doc(id).update({
      title
    })
  }

  // deletes the clip and udpates it 
  // makes a DELETE request to firebase itself
  async deleteClip(clip: IClip) {
    // reference to the file 
    const clipRef = this.storage.ref(`clips/${clip.fileName}`)
    const screenshotRef = this.storage.ref(
      `screenshots/${clip.screenshotFileName}`
    )

    await clipRef.delete()
    await screenshotRef.delete()

    await this.clipsCollection.doc(clip.docID).delete()
  }

  // gets the clips/queries them
  async getClips() {

    console.log('get clips is fired')

    if (this.pendingReq) {
      return
    }

    this.pendingReq = true

    // query will tell Firebase to retrieve first 6 resutls from DB
    let query = this.clipsCollection.ref.orderBy(
      'timestamp', 'desc'
    ).limit(6)

    const { length } = this.pageClips

    if (length) {
      const lastDocID = this.pageClips[length - 1].docID
      const lastDoc = await this.clipsCollection.doc(lastDocID)
        .get()
        .toPromise()

      query = query.startAfter(lastDoc) // we tell FireBase you start looking for documents after a specific doucment.
    }

    // loop thru the documents after getting them
    const snapshot = await query.get()  // returns a promsie to resolves an Object called "snapshot"

    // push the document data from our query INTO the page documents array
    // then we loop thru documents using FOR-EACH
    snapshot.forEach(doc => {
      this.pageClips.push({
        docID: doc.id,
        ...doc.data()
      })
    })

    this.pendingReq = false
  }

  resolve(
    route: ActivatedRouteSnapshot, state: RouterStateSnapshot
  ) {
    return this.clipsCollection.doc(route.params.id)
      .get()
      .pipe(
        map(snapshot => {
          const data = snapshot.data()

          if (!data) {
            this.router.navigate(['/'])
            return null
          }

          return data
        })
      )
  }
}
