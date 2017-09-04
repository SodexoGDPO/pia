import { Component, ElementRef, OnInit, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { Evaluation } from 'app/entry/entry-content/evaluations/evaluation.model';

import { ModalsService } from 'app/modals/modals.service';
import { PiaService } from 'app/entry/pia.service';

@Component({
  selector: 'app-refuse-pia',
  templateUrl: './refuse-pia.component.html',
  styleUrls: ['./refuse-pia.component.scss']
})
export class RefusePIAComponent implements OnInit {

  rejectionReasonForm: FormGroup;
  rejectionState: boolean;
  showRejectionReasonButtons: boolean;
  showResendValidationButton: boolean;
  modificationsMadeForm: FormGroup;
  displayEditButton1 = false;
  displayEditButton2 = false;

  constructor(private router: Router,
              private el: ElementRef,
              private _modalsService: ModalsService,
              private _piaService: PiaService) { }

  ngOnInit() {
    this.rejectionReasonForm = new FormGroup({
      rejectionReason: new FormControl()
    });
    this.modificationsMadeForm = new FormGroup({
      modificationsMade: new FormControl()
    });

    this._piaService.getPIA().then(() => {
      if (this._piaService.pia.rejected_reason) {
        this.rejectionReasonForm.controls['rejectionReason'].patchValue(this._piaService.pia.rejected_reason);
        this.displayEditButton1 = true;
        this.showRejectionReasonButtons = true;
        this.rejectionReasonForm.controls['rejectionReason'].disable();
      }

      if (this._piaService.pia.applied_adjustements && this._piaService.pia.rejected_reason) {
        this.modificationsMadeForm.controls['modificationsMade'].patchValue(this._piaService.pia.applied_adjustements);
        if (this._piaService.pia.status === 2 || this._piaService.pia.status === 3) {
          this.displayEditButton2 = true;
          this.showResendValidationButton = true;
        } else {
          this.modificationsMadeForm.controls['modificationsMade'].disable();
        }
      }

      // Textareas auto resize
      const rejectionTextarea = document.getElementById('pia-refuse-reason');
      if (rejectionTextarea) {
        this.autoTextareaResize(null, rejectionTextarea);
      }
      const modificationsTextarea = document.getElementById('pia-refuse-modifications');
      if (modificationsTextarea) {
        this.autoTextareaResize(null, modificationsTextarea);
      }
    });

  }

  /**
   * Executes functionnalities when focusing rejection reason field.
   */
  rejectionReasonFocus() {
    this.displayEditButton1 = false;
  }

  /**
   * Executes functionnalities when focusing modifications made field.
   */
  modificationsMadeFocus() {
    this.displayEditButton2 = false;
  }

  /**
   * Enable rejection reason and modification made fields
   */
  activateRejectionReasonEdition() {
    this.displayEditButton1 = false;
    this.rejectionReasonForm.controls['rejectionReason'].enable();
  }

  abandon() {
    this._modalsService.openModal('modal-abandon-pia');
  }

  refuse() {
    this._piaService.pia.status = 1;
    this._piaService.pia.update().then(() => {
      this._piaService.cancelAllValidatedEvaluation().then(() => {
        this.router.navigate(['entry', this._piaService.pia.id, 'section', 1, 'item', 1]);
        this._modalsService.openModal('modal-refuse-pia');
      });
    });
  }

  /**
   * Executes functionnalities when losing focus from rejection reason field.
   */
  rejectionReasonFocusOut() {
    const rejectionReasonValue = this.rejectionReasonForm.value.rejectionReason;
    setTimeout(() => {
      if (rejectionReasonValue && rejectionReasonValue.length > 0) {
        this.displayEditButton1 = true;
        this.rejectionReasonForm.controls['rejectionReason'].disable();
        this.showRejectionReasonButtons = true;
      } else {
        this.showRejectionReasonButtons = false;
      }
    }, 1);
    this._piaService.pia.rejected_reason = this.rejectionReasonForm.value.rejectionReason;
    this._piaService.pia.update();
  }

  /**
   * Executes functionnalities when losing focus from modifications made field.
   */
  modificationsMadeFocusOut() {
    const modificationsMadeValue = this.modificationsMadeForm.value.modificationsMade
    const resendButton = this.el.nativeElement.querySelector('.pia-entryContentBlock-footer > button');
    setTimeout(() => {
      if (modificationsMadeValue && modificationsMadeValue.length > 0) {
        this.displayEditButton2 = true;
        this.modificationsMadeForm.controls['modificationsMade'].disable();
        this.showResendValidationButton = true;
      } else {
        this.showResendValidationButton = false;
      }
      if (resendButton) {
        if (modificationsMadeValue) {
          resendButton.removeAttribute('disabled');
        } else {
          resendButton.setAttribute('disabled', true);
        }
      }
    }, 1);
    this._piaService.pia.applied_adjustements = this.modificationsMadeForm.value.modificationsMade;
    this._piaService.pia.update();
  }

  autoTextareaResize(event: any, textarea: HTMLElement) {
    if (event) {
      textarea = event.target;
    }
    if (textarea.clientHeight < textarea.scrollHeight) {
      textarea.style.height = textarea.scrollHeight + 'px';
      if (textarea.clientHeight < textarea.scrollHeight) {
        textarea.style.height = (textarea.scrollHeight * 2 - textarea.clientHeight) + 'px';
      }
    }
  }
}
