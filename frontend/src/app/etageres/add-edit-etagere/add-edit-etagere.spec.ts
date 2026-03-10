import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditEtagere } from './add-edit-etagere';

describe('AddEditEtagere', () => {
  let component: AddEditEtagere;
  let fixture: ComponentFixture<AddEditEtagere>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditEtagere],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditEtagere);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
