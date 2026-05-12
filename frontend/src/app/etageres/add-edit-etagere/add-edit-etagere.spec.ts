import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditEtagereComponent } from './add-edit-etagere';

describe('AddEditEtagere', () => {
  let component: AddEditEtagereComponent;
  let fixture: ComponentFixture<AddEditEtagereComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditEtagereComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditEtagereComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
