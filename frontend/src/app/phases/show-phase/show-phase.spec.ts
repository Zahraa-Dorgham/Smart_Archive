import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPhase } from './show-phase';

describe('ShowPhase', () => {
  let component: ShowPhase;
  let fixture: ComponentFixture<ShowPhase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowPhase],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowPhase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
