import {
  Component,
  OnInit,
  OnChanges,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../../../shared/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Candidate } from '../../../core/models/candidate.model';

@Component({
  selector: 'app-candidates-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './candidates-list.component.html',
  styleUrls: ['./candidates-list.component.css'],
})
export class CandidatesListComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() candidates: Candidate[] = [];

  @Output() viewCandidate = new EventEmitter<string>();
  @Output() editCandidate = new EventEmitter<string>();
  @Output() deleteCandidate = new EventEmitter<string>();
  @Output() focusCandidate = new EventEmitter<Candidate>();

  displayedColumns: string[] = [
    'profileImage',
    'fullName',
    'summary',
    'email',
    'age',
    'city',
    'actions',
  ];
  dataSource: MatTableDataSource<Candidate> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.data = this.candidates;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candidates']) {
      this.dataSource.data = this.candidates;
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onView(candidateId: string): void {
    this.viewCandidate.emit(candidateId);
  }

  onEdit(candidateId: string): void {
    this.editCandidate.emit(candidateId);
  }

  onDelete(candidateId: string): void {
    this.deleteCandidate.emit(candidateId);
  }

  onRowClick(candidate: Candidate): void {
    this.focusCandidate.emit(candidate);
  }
}
