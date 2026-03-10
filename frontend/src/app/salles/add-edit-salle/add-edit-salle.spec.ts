import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditSalleComponent } from './add-edit-salle';

describe('AddEditSalle', () => {
  let component: AddEditSalleComponent;
  let fixture: ComponentFixture<AddEditSalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditSalleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditSalleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
