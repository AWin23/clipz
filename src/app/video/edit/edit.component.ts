import {
  Component, OnDestroy, OnInit, Input, OnChanges, Output,
  EventEmitter
} from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import IClip from 'src/app/models/clips.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClipService } from 'src/app/services/clip.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() activeClip: IClip | null = null // Input property to receive the active clip data
  inSubmission = false // set submission propeorty to off
  showAlert = false // set alert flag to off
  alertColor = 'blue' // set curernt aleert proerpty to BLUE for now. 
  alertMsg = 'Please wait! Upadting clip.'
  @Output() update = new EventEmitter()

  clipID = new FormControl('') // Form control for clip ID
  title = new FormControl('', [ // Form control for clip title with validation rules
    Validators.required,
    Validators.minLength(3),
  ])
  // Registering the upload form under the title
  editForm = new FormGroup({
    title: this.title,
    id: this.clipID
  })

  constructor(
    private modal: ModalService,
    private clipService: ClipService
  ) { }

  ngOnInit(): void {
    // Register the edit modal with the ModalService when the component initializes
    this.modal.register('editClip')
  }

  ngOnDestroy() {
    // Unregister the edit modal from the ModalService when the component is destroyed
    this.modal.unregister('editClip')
  }

  ngOnChanges() {
    // React to changes in the activeClip input property
    if (!this.activeClip) {
      return // If there is no active clip, do nothing
    }

    // Update the form controls with the active clip's data
    this.inSubmission = false
    this.showAlert = false
    this.clipID.setValue(this.activeClip.docID) // Set the clip ID form control value
    this.title.setValue(this.activeClip.title) // Set the title form control value
  }

  async submit() {
    // if activeClip is empty -> if so return the argument
    if (!this.activeClip) {
      return
    }

    // Set flags and messages to indicate submission is in progress
    this.inSubmission = true; // Flag to indicate submission in progress
    this.showAlert = true; // Flag to show alert message
    this.alertColor = 'blue'; // Set alert color to blue
    this.alertMsg = 'Please wait! Updating clip.'; // Set alert message

    try {
      // Call the clipService to update the clip with the provided ID and title
      await this.clipService.updateClip(this.clipID.value, this.title.value);
    } catch (e) {
      // Handle any errors that occur during the update process
      this.inSubmission = false; // Set submission flag back to false
      this.alertColor = 'red'; // Set alert color to red
      this.alertMsg = 'Something went wrong. Please try again later'; // Update alert message
      return; // Exit the method
    }

    this.activeClip.title = this.title.value
    this.update.emit(this.activeClip) // active property contains the ID and title clip
    // parent is going to  need to know the information when udpating the data

    // If update is successful, update flags and alert message to indicate success
    this.inSubmission = false; // Set submission flag back to false
    this.alertColor = 'green'; // Set alert color to green
    this.alertMsg = 'Success!'; // Update alert message
  }
}

