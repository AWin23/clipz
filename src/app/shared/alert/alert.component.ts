import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
  @Input() color = 'blue'

  // get keyword allows us to acesss the value returned by the function as a propoerty
  // allows us to create properties with extra logic before the property is set.
  get bgColor() {
    return `bg-${this.color}-400`
  }

  constructor() { }

  ngOnInit(): void {
  }

}
