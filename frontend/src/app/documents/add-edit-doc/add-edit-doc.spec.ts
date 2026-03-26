import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDocumentComponent } from './add-edit-doc';

describe('AddEditDoc', () => {
  let component: AddEditDocumentComponent;
  let fixture: ComponentFixture<AddEditDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditDocumentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditDocumentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
