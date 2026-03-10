import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEtagere } from './show-etagere';

describe('ShowEtagere', () => {
  let component: ShowEtagere;
  let fixture: ComponentFixture<ShowEtagere>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowEtagere],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowEtagere);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
