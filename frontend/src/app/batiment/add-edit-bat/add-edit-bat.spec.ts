import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditBatComponent } from './add-edit-bat';

describe('AddEditBatComponent', () => {
  let component: AddEditBatComponent;
  let fixture: ComponentFixture<AddEditBatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditBatComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddEditBatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});