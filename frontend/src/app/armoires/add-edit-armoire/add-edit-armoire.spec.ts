import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditArmoireComponent } from './add-edit-armoire';

describe('AddEditArmoire', () => {
  let component: AddEditArmoireComponent;
  let fixture: ComponentFixture<AddEditArmoireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditArmoireComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditArmoireComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
