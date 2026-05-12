import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEtagereComponent } from './show-etagere';

describe('ShowEtagere', () => {
  let component: ShowEtagereComponent;
  let fixture: ComponentFixture<ShowEtagereComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowEtagereComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowEtagereComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
