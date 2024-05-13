import { AngularFireAuth } from "@angular/fire/compat/auth";
import { Injectable } from "@angular/core";
import { AsyncValidator, AbstractControl, ValidationErrors } from "@angular/forms";

// by adding this decorator, we will be able to inject services into the constructor function 
@Injectable({
    providedIn: 'root'
})
export class EmailTaken implements AsyncValidator {
    constructor(private auth: AngularFireAuth) { }

    validate = async (control: AbstractControl): Promise<ValidationErrors | null> => {
        try {
            console.log('validate is hit');
            const response = await this.auth.fetchSignInMethodsForEmail(control.value);
            return response.length ? { emailTaken: true } : null;
        } catch (error) {
            console.error('Error checking email availability:', error);
            throw error; // Rethrow the error to be caught by the caller
        }
    }

}
