import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDossier } from './add-edit-dossier';

describe('AddEditDossier', () => {
  let component: AddEditDossier;
  let fixture: ComponentFixture<AddEditDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditDossier],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
