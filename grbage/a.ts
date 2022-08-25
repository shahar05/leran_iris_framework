import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, HostListener, Injector, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { interval, Observable, of, Subscription, timer } from 'rxjs';
import { ErrorsQuery } from '../../../../akitaFeatures/error/errors.query';
import { ErrorsService } from '../../../../akitaFeatures/error/errors.service';
import { Factor } from '../../../../akitaFeatures/factors/factor.model';
import { FactorsQuery } from '../../../../akitaFeatures/factors/factors.query';
import { FactorsService } from '../../../../akitaFeatures/factors/factors.service';
import { AuthFactor, AuthFactorSubModule, FactorStatus, MessageType, MobileFactorType, NextFactorReqActionOption } from '../../../../app.enums';
import { FactorError, PostBackResponseForInfipPushFactor, PostBackResponseForTotp, successTimeout } from '../../../../app.models';
import { DynamicFactorService } from '../../dynamic-factor.service';
import { BaseFactorDirective } from '../base-factor.directive';
import { Error } from '../../../../akitaFeatures/error/error.model'
//app/akitaFeatures/error/error.model.ts
enum EnrollState {
  Enrolled,
  MobileSelection,
  QrCode
}

enum PushMessageMode {
  Sent,
  HalfTtlPasses,
  Expired
}
@Component({
  selector: 'infip-push-factor',
  templateUrl: './infip-push-factor.component.html',
  styleUrls: ['./infip-push-factor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfipPushFactorComponent extends BaseFactorDirective implements OnInit, OnDestroy {
  @Input() isEnrollAction = false;
  @Output() done = new EventEmitter();
  MobileFactorType = MobileFactorType;
  qrSecret
  inrollmentMode: boolean = false

  currentEnrollState: EnrollState;
  EnrollState = EnrollState;


  MessageType = MessageType;
  // @ViewChildren('input', { read: ElementRef }) otpInputs: QueryList<ElementRef>;

  showHelpLink = false;
  currError: Error;
  lastWarnId: string | number;

  otpForm: FormGroup;
  loading = false;
  skipValueChangeEvent = false;
  serverError: string;
  qrCode: string;
  hideQrCode = true;
  totpSecret: string;
  subscription: Subscription
  errorListenner: Subscription
  countDown: Subscription;
  counter: number;
  pushSent = false;
  successMessage = false;
  autoPush = true;
  deviceName: string;
  challengeResponse: PostBackResponseForInfipPushFactor;
  errorMessage: string;
  pushMessageMode: PushMessageMode;
  PushMessageModeEnum = PushMessageMode;

  constructor(private injector: Injector,
    private factorQuery: FactorsQuery,
    private factorService: FactorsService,
    private errorQuery: ErrorsQuery,
    private errorService: ErrorsService,
    private cdr: ChangeDetectorRef,
    private dynamicFactorSerivce: DynamicFactorService,) {
    super(injector)
  }

  ngOnInit(): void {
    this.listenToErrors();
    this.initFactor();
  }

  changeEnrollState(enrollState: EnrollState) {
    this.currentEnrollState = enrollState;
    this.cdr.detectChanges();
  }

  addMockQrCode() {
    const mockQrCodeSecret = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQAAAADcA+lXAAADO0lEQVR4Xu2VSw7bQAxDc4Pc/5a+QVo+UmOnm6LtphAoJzP6kM8bIXl9/jFevzb+NAooQFFAAYoCClAUUICigAIUBRSgKKAAxf8DuF7E+9Kji94UOV7vDxfKAlYCaGCPW5dz2c0UY5QF7AR4eB62Ri3vzMUSwYqygN0AUmSkp4cn4wK2A5T6b4M6/zY05P5WFrAQMENml06OpHBS3/oC1gFYGYt+80RZwEbAiVG8WZ9ZHPXojO9EAasA0v5UISZTHpTHWSJBwBWwEYBYw1FD0oUR21tvwT/uArYBJMF3u8TEdfdlTV3AUsAo4ER5rHL5JQdawE7A2R5/pR0fTHWG7rqAfQCP5cXzui9CckBwj+dTgGIR4CyRKynROw0C1VkhRwGrAB/5jbAz/ni+VuoLUsAuAH0rxoEfB/2LPxVNwi5gK4BlUuaGfSZ4tXIdewGKRQC3713xsvAFMH3qJ6GAXQBZ1JbQIsQp8Iorq19WwEaAEHHFQTWWnHL6VbysgI0AbE+5YSE9zvESBawCXLYoBDLLjazOo/UkFLAKkDXxJSkqY3Ep08D3DSlgFyDja9bop+hxD9V3QAUsBFh5LIOcZcosN80CFgI0urwoEpnjUCr99VimvKKAfQC3JEH3NtPaNJxNs4CVgFgm10nL+i/zk1DALsDb8/yA8LORNr8qIRtz3AVsA6Cd7yW9eGQXH/wHdCMK2AWwZgqB5OURS1ZJTNQk0gJWAZBBkRaRlRq5peS05lUFrAPIboXnZC68ZU/0IRSwCnD02Sdvj2Wa+AoOXaKAVQDZcBnywg2IIY1whChgKcBhhqxyfue2uXP7C/isAlyzJiPiFCIo2i5mpQrYB8imnAHW9OM0TS8QZqKAZQDMYLBIgpKPrGPWeV5UwC5A/NkUXWroPAP16FtUwEbAxCAkYI84XQKh4zlRwCqAVwYrgKR6ZpmCRFDAVgAdyzWe1fEBz1Pfx1/ANoCGHkWm2ksk4KlooChgL8BbgjTbpKEsMPWKZAXsBsjqOSlEwNZgj6CAhYAnhupQTAXvJr0CVgIkiSgFy3McLs12WcBCwF9HAQUoCihAUUABigIKUBRQgKKAAhQFFKBYAPgBe0I7qFUwsV0AAAAASUVORK5CYII=";
    this.qrCode = `data:image/png;base64,${mockQrCodeSecret}`;
    this.cdr.detectChanges();
  }

  listenToErrors() {
    this.errorListenner = this.errorQuery.selectLast().subscribe((error: Error) => {
      console.log(error);
      this.currError = error;
      this.errorMessage = error?.message;
      this.cdr.detectChanges();
    })
  }


  private getPayloadObj(enroll = false) {
    let notEnrollPayload = {
      module: AuthFactor.InfipPush,
      action: NextFactorReqActionOption.Challenge,
      level: 0,
      payload: {}
    }
    let enrollPayload = {
      module: AuthFactor.factorEnroll,
      submodule: AuthFactorSubModule.InfipPush,
      action: NextFactorReqActionOption.Challenge,
      level: 0,
      payload: {}
    }

    return enroll ? enrollPayload : notEnrollPayload
  }


  private generateQRCode(ignoreAutoPush = false) {

    let paylaod = this.getPayloadObj(this.isEnrollAction);


    this.dynamicFactorService.initFactorItem(paylaod).subscribe((res: PostBackResponseForInfipPushFactor) => {
      this.deviceName = `Infinipoint Push (${res.authenticatorLabel})`;
      this.autoPush = res.autoPush === [true].toString();
      this.challengeResponse = res;
      if (this.isEnrollAction) {
        this.qrCode = `data:image/png;base64,${res.tokenEnrollmentQR}`;
        this.doPollingActions(res.pushTokenInterval, { isEnrollAction: true });
        this.hideQrCode = false;
        this.setCountdown(res);
      } else {
        if (!ignoreAutoPush && this.autoPush) {
          this.sendPush();
        }

      }
      this.cdr.detectChanges();
    });
  }


  sendPush() {
    this.pushSent = true;
    this.setCountdown(this.challengeResponse);
    this.pushMessageMode = PushMessageMode.Sent;
    this.doPollingActions(this.challengeResponse.pushTokenInterval, {
      isEnrollAction: false, additionalData: {
        authenticator: this.challengeResponse['authenticator'],
        autoPush: this.autoPush
      }
    }, true);
    this.cdr.detectChanges();

  }


  private replaceErrorWithHelpingLink(lastWarnId: string | number, delayTimeInSec: number = 15) {
    setTimeout(() => {
      console.log('lastWarnId', lastWarnId);
      console.log('this.currError.id', this.currError.id);
      this.showHelpLink = lastWarnId === this.currError.id
    }, delayTimeInSec * 1000);
  }

  private setCountdown({ ttl }: PostBackResponseForInfipPushFactor) {
    const tick = 1000;

    ttl = Math.floor(ttl / 1000); // Making the equality operator safe to use
    this.counter = ttl; 
    const timeToDisplayWarn = 12;
    const timeToDisplayHelpLink = 15;

    this.countDown = timer(0, tick)
      .subscribe(() => {
      console.log('this.counter', this.counter);

      --this.counter;
      if (!this.isEnrollAction) {

        if (this.counter === timeToDisplayWarn) {
          this.pushMessageMode = PushMessageMode.HalfTtlPasses;
          this.lastWarnId = this.errorService.add('If you haven’t received the push notification yet, please check the Infinipoint App on your phone');
          // Alternative add here a set timeout
          this.replaceErrorWithHelpingLink(this.lastWarnId);
        }

        if (this.counter === ttl / 1000 - 27) {
          this.errorMessage = null;
        }

      }
      if (this.counter <= 0) {
        this.pushMessageMode = PushMessageMode.Expired;
        this.errorService.add('Infinipoint Push notification expired')
        this.pushSent = false;
        this.addMockQrCode();
        if (this.isEnrollAction) {
          this.errorService.add('Enrollment session timed out')
        }
        this.counter = null;
        this.hideQrCode = true;
        this.countDown.unsubscribe();
        this.subscription.unsubscribe();

      }
      this.cdr.detectChanges();
    });
  }

  autoPushChange({ checked }: { checked: boolean }) {
    this.autoPush = checked;
  }

  sendPushViaButton() {
    this.errorService.clear();
    if (this.pushMessageMode && this.pushMessageMode == PushMessageMode.Expired) {
      this.initFactor();
      return;
    }
    this.sendPush();
  }


  doPollingActions(intervalTime: number,
    pullingData: {
      isEnrollAction: boolean,
      additionalData?: any
    },
    isSend = false
  ) {

    const secondsCounter = interval(intervalTime * 1000);

    let payload = this.getPayloadObj();

    if (pullingData.isEnrollAction) {
      payload.action = NextFactorReqActionOption.response;
      payload.module = AuthFactor.factorEnroll;
      payload['submodule'] = AuthFactorSubModule.InfipPush;
      payload.payload = {
        regStep: 'recheck',
        autoPush: this.autoPush.toString()
      }
      payload['recheck'] = 'register';
    } else {
      payload.action = NextFactorReqActionOption.response;
      payload.payload = {
        authStep: isSend ? 'send' : 'recheck',
        autoPush: this.autoPush.toString()
      }
      if (pullingData.additionalData) {
        payload.payload['authenticator'] = pullingData.additionalData.authenticator;
        payload.payload['autoPush'] = pullingData.additionalData.autoPush;
      }
      payload['recheck'] = 'authenticate';
    }

    this.actRecheckCall(payload);
    this.subscription = secondsCounter.subscribe(n => {
      this.actRecheckCall(payload);
    })
  }

  private actRecheckCall(payload: { module: AuthFactor; action: string; level: number; payload: {}; }) {
    payload.payload['autoPush'] = this.autoPush.toString();

    this.factorService.nextFactorItem(payload, true, true).subscribe((res: PostBackResponseForInfipPushFactor) => {
      if (payload.payload['authStep'] === 'send') {
        payload.payload['authStep'] = 'recheck';
      }
      if (!res) {
        this.errorService.add('Unexpected error occurred')
        return;
      }
      if (res.error && res.error != 'nop') {

        if (res.error.toLowerCase() !== 'authentication approved') {
          this.pushSent = false;
          this.errorService.add(res.error)
          this.generateQRCode(true);
          return;
        }

        const mockQrCodeSecret = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQAAAADcA+lXAAADO0lEQVR4Xu2VSw7bQAxDc4Pc/5a+QVo+UmOnm6LtphAoJzP6kM8bIXl9/jFevzb+NAooQFFAAYoCClAUUICigAIUBRSgKKAAxf8DuF7E+9Kji94UOV7vDxfKAlYCaGCPW5dz2c0UY5QF7AR4eB62Ri3vzMUSwYqygN0AUmSkp4cn4wK2A5T6b4M6/zY05P5WFrAQMENml06OpHBS3/oC1gFYGYt+80RZwEbAiVG8WZ9ZHPXojO9EAasA0v5UISZTHpTHWSJBwBWwEYBYw1FD0oUR21tvwT/uArYBJMF3u8TEdfdlTV3AUsAo4ER5rHL5JQdawE7A2R5/pR0fTHWG7rqAfQCP5cXzui9CckBwj+dTgGIR4CyRKynROw0C1VkhRwGrAB/5jbAz/ni+VuoLUsAuAH0rxoEfB/2LPxVNwi5gK4BlUuaGfSZ4tXIdewGKRQC3713xsvAFMH3qJ6GAXQBZ1JbQIsQp8Iorq19WwEaAEHHFQTWWnHL6VbysgI0AbE+5YSE9zvESBawCXLYoBDLLjazOo/UkFLAKkDXxJSkqY3Ep08D3DSlgFyDja9bop+hxD9V3QAUsBFh5LIOcZcosN80CFgI0urwoEpnjUCr99VimvKKAfQC3JEH3NtPaNJxNs4CVgFgm10nL+i/zk1DALsDb8/yA8LORNr8qIRtz3AVsA6Cd7yW9eGQXH/wHdCMK2AWwZgqB5OURS1ZJTNQk0gJWAZBBkRaRlRq5peS05lUFrAPIboXnZC68ZU/0IRSwCnD02Sdvj2Wa+AoOXaKAVQDZcBnywg2IIY1whChgKcBhhqxyfue2uXP7C/isAlyzJiPiFCIo2i5mpQrYB8imnAHW9OM0TS8QZqKAZQDMYLBIgpKPrGPWeV5UwC5A/NkUXWroPAP16FtUwEbAxCAkYI84XQKh4zlRwCqAVwYrgKR6ZpmCRFDAVgAdyzWe1fEBz1Pfx1/ANoCGHkWm2ksk4KlooChgL8BbgjTbpKEsMPWKZAXsBsjqOSlEwNZgj6CAhYAnhupQTAXvJr0CVgIkiSgFy3McLs12WcBCwF9HAQUoCihAUUABigIKUBRQgKKAAhQFFKBYAPgBe0I7qFUwsV0AAAAASUVORK5CYII=";
        this.qrCode = `data:image/png;base64,${mockQrCodeSecret}`;
        this.hideQrCode = true;
        this.counter = null;
        this.countDown.unsubscribe();
        this.subscription.unsubscribe();
        this.hideQrCode = true;
        this.cdr.detectChanges();
        return;
      }
      let factorItem = res?.factors?.find(x => x.actionName === AuthFactor.InfipPush);

      if (this.isEnrollAction && res.status == FactorStatus.Enrolled) {
        this.successMessage = true;
        setTimeout(() => {
          this.done.emit();
        }, successTimeout);
        return;
      }

      if (factorItem && factorItem.registered || res.factors) {
        let isEnrollNeeded = this.factorService.checkIfEnrollNeededInFactors(res);
        this.dynamicFactorSerivce.setNextFactor(res.factors, isEnrollNeeded);
        this.subscription.unsubscribe();
        return;
      }
    }, err => {
      this.errorService.add('Unexpected error occurred')
    });
  }

  discoverQrCode() {
    this.generateQRCode();
  }


  submitFactor() { }

  initFactor() {
    const factorEntity: Factor = <Factor>this.factorQuery.getActive();
    let factor = factorEntity.factors.find(x => x.actionName === AuthFactor.InfipPush)

    if (this.isEnrollAction) {
      this.currentEnrollState = EnrollState.MobileSelection;
      this.addMockQrCode();
      this.hideQrCode = true;
    } else {
      this.currentEnrollState = EnrollState.Enrolled;
      this.generateQRCode();
    }
  }

  resetSession() {
    const factorEntity: Factor = <Factor>this.factorQuery.getActive();

    let factor = factorEntity.factors.find(x => x.actionName === AuthFactor.InfipPush)

    if (factor.required) {
      this.errorService.clear();
      this.generateQRCode();
      return;
    }

    let currentfactorItem: Factor = <Factor>this.factorQuery.getActive()
    let entity = this.factorQuery.getAll().find(e => e.level === currentfactorItem.level - 1);
    const factors = entity.factors;
    let isEnrollNeeded = this.factorService.checkIfEnrollNeededInFactors(<any>{ factors: factors });
    this.factorService.setNextFactor(factors, isEnrollNeeded);
  }

  ngOnDestroy(): void {
    this.errorService.clear();
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    if (this.countDown) {
      this.countDown.unsubscribe();
    }
    if (this.errorListenner) {
      this.errorListenner.unsubscribe();
    }
  }

}


          //\
         // \\
        //   \\
       //     \\
      //       \\
     //         \\
    //           \\
   // Stop Count  \\
  //  Stop Polling \\
 //=================\\