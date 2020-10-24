import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {PositionsService} from "../../../shared/services/positions.service";
import {Position} from "../../../shared/interfaces";
import {MaterialInstance, MaterialService} from "../../../shared/classes/material.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {response} from "express";

@Component({
  selector: 'app-positions-form',
  templateUrl: './positions-form.component.html',
  styleUrls: ['./positions-form.component.css']
})
export class PositionsFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input('CategoryId') categoryId: string
  @ViewChild('modal') modalRef: ElementRef

  positions: Position[] =[]
  loading = false
  positionId = null
  modal: MaterialInstance
  form: FormGroup

  constructor(private positionsService: PositionsService) {
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(null, Validators.required),
      cost: new FormControl(null, [Validators.required, Validators.min(1)])
    })
    this.loading = true
    this.positionsService.fetch(this.categoryId).subscribe(positions =>{
      this.positions = positions
      this.loading = false
    })
  }
  ngOnDestroy() {
    this.modal.destroy()
  }
  ngAfterViewInit() {
    this.modal = MaterialService.initModal(this.modalRef)
  }
  onSelectPosition(position: Position) {
    this.positionId = position._id
    this.form.patchValue({
      name: position.name,
      cost: position.cost
    })
    this.modal.open()
    MaterialService.updateTextInputs()
  }
  onAddposition() {
    this.positionId = null
    this.form.reset({
      name: null,
      cost: null
    })
    this.modal.open()
    MaterialService.updateTextInputs()
  }
  onDeletePosition(event: Event, position: Position) {
    event.stopPropagation()
    const decision = window.confirm(`Вы действительно хотите удалить позицию "${position.name}"?`)
    if (decision) {
      this.positionsService.delete(position).subscribe(
        response => {
          const idx = this.positions.findIndex(p => p._id === position._id)
          this.positions.splice(idx, 1)
          MaterialService.toast(response.message)
        },
        error => MaterialService.toast(error.error.message)
      )
    }
  }
  onCancel() {
    this.modal.close()
  }
  onSubmit() {
    this.form.disable()
    const newPosition: Position = {
      name: this.form.value.name,
      cost: this.form.value.cost,
      category: this.categoryId
    }
    const complited = () => {
      this.modal.close()
      this.form.reset({name: '', cost: ''})
      this.form.enable()
    }
    if (this.positionId) {
      newPosition._id = this.positionId
      this.positionsService.update(newPosition).subscribe(
        position => {
          const idx = this.positions.findIndex(p => p._id === position._id)
          this.positions[idx] = position
          MaterialService.toast('Позиция изменена')
        },
        error => MaterialService.toast(error.error.message),
        complited
      )
    } else  {
      this.positionsService.create(newPosition).subscribe(
        position => {
          MaterialService.toast('Позиция создана')
          this.positions.push(position)
        },
        error => MaterialService.toast(error.error.message),
        complited
      )
    }

  }
}
