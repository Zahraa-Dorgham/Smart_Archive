import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBoitierComponent } from './show-boitier';

describe('ShowBoitier', () => {
  let component: ShowBoitierComponent;
  let fixture: ComponentFixture<ShowBoitierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowBoitierComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowBoitierComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
