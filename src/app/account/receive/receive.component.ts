import { Component, Inject, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from '../../services/ui-state.service';
import { OrchestratorService } from '../../services/orchestrator.service';
import { CommunicationService } from '../../services/communication.service';
import { IconService } from '../../services/icon.service';

@Component({
    selector: 'app-account-receive',
    templateUrl: './receive.component.html',
    styleUrls: ['./receive.component.css']
})
export class AccountReceiveComponent implements OnInit, OnDestroy {
    ngOnDestroy(): void {

    }

    ngOnInit(): void {

    }

}