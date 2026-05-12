import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditBoitierComponent } from './add-edit-boitier';

describe('AddEditBoitierCom', () => {
  let component: AddEditBoitierComponent;
  let fixture: ComponentFixture<AddEditBoitierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditBoitierComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditBoitierComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
