import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBoitier } from './show-boitier';

describe('ShowBoitier', () => {
  let component: ShowBoitier;
  let fixture: ComponentFixture<ShowBoitier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowBoitier],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowBoitier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
