import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ClipService } from 'src/app/services/clip.service';
import IClip from 'src/app/models/clips.models';
import { ModalService } from 'src/app/services/modal.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManageComponent implements OnInit {
  videoOrder = '1'
  clips: IClip[] = []
  activeClip: IClip | null = null
  sort$: BehaviorSubject<string>

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clipService: ClipService,
    private modal: ModalService
  ) { 
    this.sort$ = new BehaviorSubject(this.videoOrder)
  }

  ngOnInit(): void {
    // Subscribe to query parameters to toggle sorting on the Manage page
    this.route.queryParams.subscribe((params: Params) => {
      // Check if the 'sort' parameter is set to '2'; if not, default to sorting by 1
      this.videoOrder = params['sort'] === '2' ? params['sort'] : 1
      this.sort$.next(this.videoOrder)
    });

    // Fetch user clips from the database using the ClipService
    this.clipService.getUserClips(this.sort$).subscribe(docs => {
      // Reset the clips array before populating it with new data
      this.clips = [];

      // Iterate through the fetched documents and populate the clips array
      docs.forEach(doc => {
        this.clips.push({
          // Include the document ID and spread the rest of the document data into the clip object
          docID: doc.id,
          ...doc.data()
        });
      });
    });
  }


  sort(event: Event) {
    const { value } = (event.target as HTMLSelectElement)

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: value
      }
    })
  }

  // allows to "close" or open modal
  openModal($event: Event, clip: IClip) {
    $event.preventDefault()

    this.activeClip = clip

    this.modal.toggleModal('editClip')
  }

  // function UDPATES the title component 
  update($event: IClip) {
    this.clips.forEach((element, index) => {
      if (element.docID == $event.docID) {
        this.clips[index].title = $event.title
      }
    })
  }

  // deletes the file from FireBase on the "Manage" tab
  deleteClip($event: Event, clip: IClip) {
    $event.preventDefault()

    this.clipService.deleteClip(clip)

    // loop thru the array of clips, splice removes them from the array 
    this.clips.forEach((element, index) => {
      if (element.docID == clip.docID) {
        this.clips.splice(index, 1)
      }
    })
  }

  // asynchrnous funciton that allows copying link of video to clipboard
  async copyToClipboard($event: MouseEvent, docID: string | undefined){
    $event.preventDefault()

    if(!docID){
      return
    }

    // set variable default of the URL
    const url = `${location.origin}/clip/${docID}`

    // call writeText
    await navigator.clipboard.writeText(url)

    // notify user we copied link to clipboard
    alert('Link Copied!')
  }

}
