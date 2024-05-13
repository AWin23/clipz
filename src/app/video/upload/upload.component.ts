import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';
import { combineLatest, forkJoin } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {

  // define flags for uploading x alert component
  showAlert = false
  alertMsg = 'Please wait! Your clip is being uploaded :) ' // for the message 
  alertColor = 'blue' // for the color of the alert
  inSubmission = false // this propoerty is responsible for disabling forms
  percentage = 0
  showPercentage = false
  user: firebase.User | null = null
  task?: AngularFireUploadTask
  screenshots: string[] = []
  selectedScreenshot = ''
  screenshotTask?: AngularFireUploadTask


  isDragover = false // flags indicated nothing is draged 
  file: File | null = null
  nextStep = false // flag inidates IF user has uploaded MP4/VID file yet
  isLoaded = false // indicate if FFMPEG is loaded or not

  // delcares the formControl group in the classs
  // 2nd paramrer are Validators THAT REQUIRE TITLE and wants its length to at least be 3. 
  title = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ])
  // registers the upload form under title
  // new instance of form group class
  uploadForm = new FormGroup({
    title: this.title
  })

  submitted = false;

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipsService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe(user => this.user = user)
    this.ffmpegService.init()
  }

  // ceases file uploads operatoins to firebase
  ngOnDestroy(): void {
    this.task?.cancel()
  }

  // function that works to allow users to upload files to the drag x drop. 
  // retrives file from the event
  async storeFile($event: Event) {
    if (this.ffmpegService.isRunning) {
      return
    }

    this.isDragover = false

    // This logic is used to get the file from either a drag and drop event or a file input event.
    this.file = ($event as DragEvent).dataTransfer ? // Check if it's a drag and drop event
      ($event as DragEvent).dataTransfer?.files.item(0) ?? null : // Get the file from the drag event if available
      ($event.target as HTMLInputElement).files?.item(0) ?? null; // Get the file from the file input if drag event is not available


    // conditionals -> 1. Check if file is not empty -> 2. check if its NOT MP4 or video(IF so, end the process)
    if (!this.file || this.file.type !== 'video/mp4') {
      // will end the iteration of the loop IF user makes it to the point.
      return
    }

    this.screenshots = await this.ffmpegService.getScreenshots(this.file)

    this.selectedScreenshot = this.screenshots[0]

    this.title.setValue(
      // if regular expressoin finds file with extension, replace with empty string
      // otherwise prefill with name of file
      this.file.name.replace(/\.[^/.]+$/, '')
    )

    // OTHERWISE, user def uploaded an MP4/VIDEO file, so its true 
    // this means an mp4 file has has been uploaded, so its true
    this.nextStep = true

    this.isLoaded = true; // this means FFMPEG is loaded
  }

  // submit buttoon that submits the form
  onSubmit(): void {
    this.submitted = true;
    console.log('onSubmit is fired!!')
  }

  // function that handles uploading video file logic/progress bar of the upload
  async uploadFile() {
    // sets these values back to their initial values
    this.uploadForm.disable() // disables the title form so user cant put anything in when uploading is ongoing
    this.showAlert = true
    this.alertMsg = 'Please wait! Your file is being uploaded in.'
    this.alertColor = 'blue'
    this.inSubmission = true
    this.showPercentage = true

    // Generates a unique ID for the clip file name
    const clipFileName = uuid();
    // Constructs the path for the clip file in the 'clips' directory
    const clipPath = `clips/${clipFileName}.mp4`;

    // Retrieves a blob from the selected screenshot URL using the ffmpegService
    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    )

    const screenshotPath = `screenshots/${clipFileName}.png`

    // store upload object in a variable called "TASK"(progress bar)
    this.task = this.storage.upload(clipPath, this.file)
    const clipRef = this.storage.ref(clipPath)

    this.storage.upload(screenshotPath, screenshotBlob)

    // store value returned by upload function to the screenshot task property
    this.screenshotTask = this.storage.upload(
      screenshotPath, screenshotBlob
    )
    const screenshotRef = this.storage.ref(screenshotPath)

    // updates the percentage property to progress property. 
    combineLatest([
      this.task.percentageChanges(),
      this.screenshotTask.percentageChanges()
    ]).subscribe((progress) => {
      const [clipProgress, screenshotProgress] = progress

      // check if the variables are empty
      if (!clipProgress || !screenshotProgress) {
        return
      }

      const total = clipProgress + screenshotProgress

      this.percentage = total as number / 200 // argument asserrted as a number
    })

    // Uploads the file to Firebase Storage and handles the upload process
    this.storage.upload(clipPath, this.file).then(() => {
    }).catch((error) => {
      // If an error occurs during the upload, handle it here
      this.alertMsg = 'An unexpected error occured. Please try again later!'
      this.alertColor = 'red' // sets it to red cuz its an error
      this.inSubmission = false // enables form again for submission
      console.error('Error uploading file:', error);
    });

    // Monitors the upload progress and gets the download URL after successful upload
    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges()
    ]).pipe(
      switchMap(() =>
        forkJoin([
          clipRef.getDownloadURL(),// Gets the download URL of the uploaded file
          screenshotRef.getDownloadURL() // Gets the download URL of the screenshot
        ]))
    ).subscribe({
      next: async (urls) => {
        const [clipUrl, screenshotURL] = urls


        // When the download URL is obtained, create a clip object with necessary details
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipFileName}.mp4`,
          url: clipUrl,
          screenshotURL,
          screenshotFileName: `${clipFileName}.png`,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }

        const clipDocRef = await this.clipsService.createClip(clip)

        console.log(clip)

        this.alertColor = 'green' // sets attribute to green
        this.alertMsg = 'Success! Your clip is now ready to share with the world.' // clip is ready to share
        this.showPercentage = false // once clip is ready to share, the percentage is FALSE

        setTimeout(() => {
          // we construct the URL as a reminder, 
          // the navigate function will assume a path is absolute
          // once upload a vidoe, it will build string into URL and redirect user to the page of vid 
          this.router.navigate([
            'clip', clipDocRef.id
          ])
        }, 1000)
      },
      error: (error) => {
        this.uploadForm.enable()

        this.alertColor = 'red'
        this.alertMsg = 'Upload failed! Please try again later.'
        this.inSubmission = true
        this.showPercentage = false
        console.error(error)
      }
    })
  }
}
