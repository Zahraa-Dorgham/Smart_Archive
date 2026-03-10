import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditArmoire } from './add-edit-armoire';

describe('AddEditArmoire', () => {
  let component: AddEditArmoire;
  let fixture: ComponentFixture<AddEditArmoire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditArmoire],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditArmoire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
