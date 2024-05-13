import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: ''
  }

  showAlert = false
  alertMsg = 'Please wait! We are loggin you in.'
  alertColor = 'blue'
  inSubmission = false


  constructor(private auth: AngularFireAuth) { }

  ngOnInit(): void {
  }

  // submits form to login the user
  async login() {
    // sets these values back to their initial values
    this.showAlert = true
    this.alertMsg = 'Please wait! Your account is being logged in.'
    this.alertColor = 'blue'
    this.inSubmission = true

    // submits user login via Firebase
    try {
      /* Using await with this.auth.signInWithEmailAndPassword ensures that the 
      authentication process waits for the signInWithEmailAndPassword method to 
      complete before proceeding further. 

      /* When you don't use await, the method call returns a Promise immediately, 
      and the code continues to execute without waiting for the authentication process to finish. 
      This can lead to issues where the catch block may not catch errors correctly 
      because the authentication process is still ongoing.*/
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email, this.credentials.password
      )
    } catch (e) {
      this.alertMsg = 'An unexpected error occured. Please try again later!'
      this.alertColor = 'red' // sets it to red cuz its an error
      this.inSubmission = false // enables form again for submission

      console.log("Error is" + e)
      return
    }

    this.alertMsg = 'Sucess! You have succesfully logged in. You may close this tab.'
    this.alertColor = 'green'
  }

}
