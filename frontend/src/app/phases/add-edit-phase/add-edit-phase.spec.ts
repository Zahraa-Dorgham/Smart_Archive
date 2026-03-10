import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditPhase } from './add-edit-phase';

describe('AddEditPhase', () => {
  let component: AddEditPhase;
  let fixture: ComponentFixture<AddEditPhase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditPhase],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditPhase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
