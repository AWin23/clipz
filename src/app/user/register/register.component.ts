import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import IUser from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { RegisterValidators } from '../validators/register-validators';
import { EmailTaken } from '../validators/email-taken';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  constructor(
    private auth: AuthService,
    private emailTaken: EmailTaken
  ) { }

  inSubmission = false

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ])

  email = new FormControl('', [
    Validators.required,
    Validators.email
  ], [this.emailTaken.validate])
  age = new FormControl(null, [
    Validators.required,
    Validators.min(18),
    Validators.max(120)
  ])
  password = new FormControl('', [
    Validators.required,
    Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$')
  ])
  confirm_password = new FormControl('', [
    Validators.required
  ])
  phoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(13),
    Validators.maxLength(13)
  ])

  showAlert = false
  alertMsg = 'Please wait! Your account is being created.'
  alertColor = 'blue'

  // register form Object 
  registerForm = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirm_password: this.confirm_password,
    phoneNumber: this.phoneNumber
  }, [RegisterValidators.match('password', 'confirm_password')])

  // this update should render the component above the form. 
  async register() {
    this.showAlert = true
    this.alertMsg = 'Please wait! Your account is being created.'
    this.alertColor = 'blue'
    this.inSubmission = true

    // connects to FireBase Authentication
    try {
      await this.auth.createUser(this.registerForm.value as IUser)
    } catch (e) {
      console.error(e)

      this.alertMsg = 'An unexpected error occured. Please try again later!'
      this.alertColor = 'red'
      this.inSubmission = false
      return
    }

    this.alertMsg = 'Sucess! Your account has been created.'
    this.alertColor = 'green'
  }
}
