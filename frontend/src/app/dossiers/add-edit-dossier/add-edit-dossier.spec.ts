import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDossierComponent } from './add-edit-dossier';

describe('AddEditDossier', () => {
  let component: AddEditDossierComponent;
  let fixture: ComponentFixture<AddEditDossierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditDossierComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditDossierComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
