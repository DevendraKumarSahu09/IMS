import { Component, Input, Output, EventEmitter, TemplateRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'avatar' | 'actions' | 'custom';
  sortable?: boolean;
  cellClass?: string;
  subtitle?: string;
  template?: TemplateRef<any>;
}

export interface TableRow {
  [key: string]: any;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css'
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() data: TableRow[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() title = '';
  @Input() selectable = false;
  @Input() showHeader = true;
  @Input() showActions = false;
  @Input() showPagination = true;
  @Input() showBulkActions = false;
  @Input() pageSize = 10;
  @Input() sortKey = '';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';

  @Output() rowClick = new EventEmitter<{ row: TableRow; index: number }>();
  @Output() selectionChange = new EventEmitter<TableRow[]>();
  @Output() sortChange = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

  currentPage = 1;
  selectedRows: TableRow[] = [];
  sortedData: TableRow[] = [];
  paginatedData: TableRow[] = [];

  Math = Math;

  ngOnInit() {
    this.updateData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['pageSize']) {
      this.updateData();
    }
  }

  updateData() {
    this.sortedData = [...this.data];
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.sortedData.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }

  get allSelected(): boolean {
    return this.selectedRows.length === this.paginatedData.length && this.paginatedData.length > 0;
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }

    this.sortedData.sort((a, b) => {
      const aVal = this.getCellValue(a, key);
      const bVal = this.getCellValue(b, key);
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updatePagination();
    this.sortChange.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedRows = [];
    } else {
      this.selectedRows = [...this.paginatedData];
    }
    this.selectionChange.emit(this.selectedRows);
  }

  toggleRowSelection(row: TableRow, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(r => r !== row);
    }
    this.selectionChange.emit(this.selectedRows);
  }

  isRowSelected(row: TableRow): boolean {
    return this.selectedRows.includes(row);
  }

  onRowClick(row: TableRow, index: number) {
    this.rowClick.emit({ row, index });
  }

  getCellValue(row: TableRow, key: string): any {
    return key.split('.').reduce((obj, prop) => obj?.[prop], row);
  }

  getBadgeClass(row: TableRow, key: string): string {
    const value = this.getCellValue(row, key);
    const statusClasses: { [key: string]: string } = {
      'approved': 'badge-success',
      'pending': 'badge-warning',
      'rejected': 'badge-danger',
      'active': 'badge-success',
      'inactive': 'badge-neutral',
      'processing': 'badge-primary'
    };
    return statusClasses[value?.toLowerCase()] || 'badge-neutral';
  }

  getAvatarClass(row: TableRow, key: string): string {
    const value = this.getCellValue(row, key);
    const colors = ['bg-primary-100', 'bg-success-100', 'bg-warning-100', 'bg-danger-100', 'bg-secondary-100'];
    const index = value?.charCodeAt(0) % colors.length;
    return colors[index] || 'bg-neutral-100';
  }

  getInitials(row: TableRow, key: string): string {
    const value = this.getCellValue(row, key);
    return value?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '';
  }
}
