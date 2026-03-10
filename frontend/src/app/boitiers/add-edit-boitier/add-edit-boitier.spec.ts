import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditBoitier } from './add-edit-boitier';

describe('AddEditBoitier', () => {
  let component: AddEditBoitier;
  let fixture: ComponentFixture<AddEditBoitier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditBoitier],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditBoitier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
